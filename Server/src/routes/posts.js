const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { authRequired, authOptional, authNoGuest } = require('../middleware/auth');

const router = express.Router();

// ====== 输入清理（防 XSS & 长度限制） ======
const ALLOWED_STATUS = ['draft', 'published', 'archived'];
const MAX_TAGS = 10;

function sanitizeText(val, maxLen = 500) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // 去除控制字符（保留 \n \t）
    .replace(/<[^>]*>/g, '')       // 去除 HTML 标签
    .replace(/[<>]/g, '')          // 去除残留尖括号
    .slice(0, maxLen)
    .trim();
}

function sanitizeContent(val) {
  if (typeof val !== 'string') return val;
  // 去除 null 字节和控制字符（保留换行和制表符）
  return val
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 剥离危险标签（防存储型 XSS）
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>|<embed[\s\S]*?<\/embed>/gi, '')
    // 剥离 base64 data URI（防存入数据库）
    .replace(/!\[([^\]]*)\]\(data:[^)]+\)/g, '![$1](uploading...)')
    .slice(0, 200000); // 200KB max
}

function sanitizeTag(val) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\\/:*?"|]/g, '')
    .slice(0, 30)
    .trim();
}

function validateCoverImage(url) {
  if (!url || url === '') return true; // null/空字符串允许
  if (typeof url !== 'string') return false;
  if (url.length > 500) return false;
  // 清理路径遍历符号
  url = url.replace(/\.\./g, '').replace(/\\/g, '/');
  // 只允许本地 /uploads/ 路径或相对路径
  return url.startsWith('/uploads/') || url.startsWith('./uploads/');
}

// ====== GET /api/posts — 文章列表（分页 + 作者筛选） ======
router.get('/', authOptional, async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page) || 1);
    const perPage  = 10;
    const offset   = (page - 1) * perPage;
    let status     = req.query.status || 'published';
    const author   = req.query.author || '';
    const tag      = req.query.tag || '';
    const search   = req.query.search || '';

    // status=all 仅 admin 可用；非 admin 强制 published
    const isAdmin = req.user && req.user.role === 'admin';
    if (status !== 'published' && !isAdmin) {
      status = 'published';
    }
    if (status === 'all' && !isAdmin) {
      status = 'published';
    }

    // 构建查询
    let countSql = 'SELECT COUNT(DISTINCT p.id) AS total FROM posts p JOIN users u ON p.author_id = u.id';
    let dataSql   = `
      SELECT DISTINCT
        p.id, p.title, p.slug, p.excerpt, p.cover_image,
        p.is_pinned, p.status, p.read_time, p.published_at AS date,
        u.username, u.nickname, u.avatar
      FROM posts p
      JOIN users u ON p.author_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (author) {
      conditions.push('u.username = ?');
      params.push(author);
    }

    // tag filter: join post_tags + tags
    if (tag) {
      countSql += ' JOIN post_tags pt_filter ON p.id = pt_filter.post_id';
      countSql += ' JOIN tags t_filter ON pt_filter.tag_id = t_filter.id';
      dataSql += ' JOIN post_tags pt_filter ON p.id = pt_filter.post_id';
      dataSql += ' JOIN tags t_filter ON pt_filter.tag_id = t_filter.id';
      conditions.push('(t_filter.slug = ? OR t_filter.name = ?)');
      params.push(tag, tag);
    }

    // search: match title, excerpt, or content
    if (search) {
      conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      countSql += where;
      dataSql += where;
    }

    dataSql += ' ORDER BY p.is_pinned DESC, p.published_at DESC LIMIT ? OFFSET ?';

    // 并行查询
    const [countResult, [rows]] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, perPage, offset]),
    ]);
    const total = countResult[0][0]?.total || 0;

    // 为每篇文章附加标签
    const postIds = rows.map(r => r.id);
    let tagMap = {};
    let likeMap = {};
    let commentMap = {};
    let userLikedSet = new Set();
    if (postIds.length > 0) {
      const [tagRows] = await pool.query(
        `SELECT pt.post_id, t.name, t.slug
         FROM post_tags pt
         JOIN tags t ON pt.tag_id = t.id
         WHERE pt.post_id IN (${postIds.map(() => '?').join(',')})`,
        postIds
      );
      tagRows.forEach(t => {
        if (!tagMap[t.post_id]) tagMap[t.post_id] = [];
        tagMap[t.post_id].push({ name: t.name, slug: t.slug });
      });

      // 点赞计数
      const [likeRows] = await pool.query(
        `SELECT post_id, COUNT(*) AS count FROM post_likes WHERE post_id IN (${postIds.map(() => '?').join(',')}) GROUP BY post_id`,
        postIds
      );
      likeRows.forEach(l => { likeMap[l.post_id] = l.count; });

      // 评论计数
      const [commentRows] = await pool.query(
        `SELECT post_id, COUNT(*) AS count FROM comments WHERE post_id IN (${postIds.map(() => '?').join(',')}) GROUP BY post_id`,
        postIds
      );
      commentRows.forEach(c => { commentMap[c.post_id] = c.count; });

      // 当前用户是否已点赞
      if (req.user) {
        const [likedRows] = await pool.query(
          `SELECT post_id FROM post_likes WHERE user_id = ? AND post_id IN (${postIds.map(() => '?').join(',')})`,
          [req.user.id, ...postIds]
        );
        likedRows.forEach(l => userLikedSet.add(l.post_id));
      }
    }

    const posts = rows.map(r => ({
      ...r,
      author: { username: r.username, nickname: r.nickname, avatar: r.avatar },
      tags: tagMap[r.id] || [],
      tag: tagMap[r.id]?.[0]?.name || 'uncategorized',
      like_count: likeMap[r.id] || 0,
      comment_count: commentMap[r.id] || 0,
      user_liked: userLikedSet.has(r.id),
      date: r.date ? r.date.toISOString().split('T')[0] : '',
    }));

    res.json({
      posts,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      total,
    });
  } catch (err) {
    console.error('get posts error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/posts/:slug — 文章详情 ======
router.get('/:slug', authOptional, async (req, res) => {
  try {
    const { slug } = req.params;

    const [rows] = await pool.query(
      `SELECT p.*, u.username, u.nickname, u.bio, u.avatar
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.slug = ?`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'post not found' });
    }

    const p = rows[0];

    // 非公开文章仅允许作者或 admin 查看
    const isAdmin = req.user && req.user.role === 'admin';
    const isAuthor = req.user && req.user.username === p.username;
    if (p.status !== 'published' && !isAdmin && !isAuthor) {
      return res.status(404).json({ message: 'post not found' });
    }

    // 获取标签
    const [tagRows] = await pool.query(
      `SELECT t.name, t.slug
       FROM post_tags pt
       JOIN tags t ON pt.tag_id = t.id
       WHERE pt.post_id = ?`,
      [p.id]
    );

    // 点赞数
    const [likeRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?',
      [p.id]
    );
    const likeCount = likeRows[0]?.count || 0;

    // 当前用户是否已点赞
    let userLiked = false;
    if (req.user) {
      const [liked] = await pool.query(
        'SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?',
        [req.user.id, p.id]
      );
      userLiked = liked.length > 0;
    }

    // 评论数
    const [commentRows] = await pool.query(
      'SELECT COUNT(*) AS count FROM comments WHERE post_id = ?',
      [p.id]
    );
    const commentCount = commentRows[0]?.count || 0;

    const post = {
      ...p,
      author: { username: p.username, nickname: p.nickname, bio: p.bio, avatar: p.avatar },
      tags: tagRows,
      tag: tagRows[0]?.name || 'uncategorized',
      like_count: likeCount,
      user_liked: userLiked,
      comment_count: commentCount,
      date: p.published_at ? p.published_at.toISOString().split('T')[0] : '',
    };

    res.json({ post });
  } catch (err) {
    console.error('get post error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/posts — 创建文章 ======
router.post('/', authRequired, authNoGuest, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const title = sanitizeText(req.body.title, 200);
    const content = sanitizeContent(req.body.content);
    const excerpt = sanitizeText(req.body.excerpt || '', 500);

    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' });
    }

    // 校验 status
    let status = (req.body.status || 'draft').toLowerCase();
    if (!ALLOWED_STATUS.includes(status)) {
      return res.status(400).json({ message: `invalid status: ${status}` });
    }

    // 仅管理员可置顶
    const is_pinned = req.body.is_pinned && req.user.role === 'admin' ? 1 : 0;

    // 标签长度限制
    const tagList = req.body.tags;
    if (tagList && (!Array.isArray(tagList) || tagList.length > MAX_TAGS)) {
      return res.status(400).json({ message: `max ${MAX_TAGS} tags allowed` });
    }

    // 生成 slug
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100) || 'post';
    const slug = baseSlug + '-' + Date.now().toString(36);

    // 计算字数和阅读时间
    const wordCount = content.replace(/\s/g, '').length;
    const readTime = Math.max(1, Math.ceil(wordCount / 400)) + ' min read';

    const published_at = status === 'published' ? new Date() : null;

    await conn.beginTransaction();

    const image_dir = `/uploads/posts/${slug}`;

    const [result] = await conn.query(
      `INSERT INTO posts (title, slug, excerpt, content, image_dir, status, is_pinned, read_time, word_count, author_id, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, excerpt || '', content, image_dir, status, is_pinned, readTime, wordCount, req.user.id, published_at]
    );

    const postId = result.insertId;

    // 处理标签
    if (tagList && Array.isArray(tagList) && tagList.length > 0) {
      await syncTags(conn, postId, tagList);
    }

    await conn.commit();

    const post = {
      id: postId, title, slug, excerpt: excerpt || '', image_dir,
      status, is_pinned: !!is_pinned,
      read_time: readTime, word_count: wordCount,
      author: { username: req.user.username },
      tags: tagList || [],
      date: published_at ? published_at.toISOString().split('T')[0] : '',
    };

    res.status(201).json({ message: 'post created', post });
  } catch (err) {
    await conn.rollback();
    console.error('create post error:', err);
    res.status(500).json({ message: 'internal server error' });
  } finally {
    conn.release();
  }
});

// ====== PUT /api/posts/:slug — 更新文章（单事务） ======
router.put('/:slug', authRequired, authNoGuest, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { slug } = req.params;

    // 确认文章存在且是作者本人
    const [rows] = await conn.query('SELECT id, author_id, slug, published_at, status FROM posts WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'post not found' });
    }
    if (rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'you are not the author' });
    }

    // 校验 status
    let status = undefined;
    if (req.body.status !== undefined) {
      status = req.body.status.toLowerCase();
      if (!ALLOWED_STATUS.includes(status)) {
        return res.status(400).json({ message: `invalid status: ${status}` });
      }
    }

    // 仅管理员可置顶/取消置顶；非管理员未显式提交时不触碰 is_pinned
    let is_pinned = undefined;
    if (req.body.is_pinned !== undefined) {
      is_pinned = req.user.role === 'admin' ? (req.body.is_pinned ? 1 : 0) : undefined;
    }

	// 校验 cover_image
	let cover_image = req.body.cover_image !== undefined ? req.body.cover_image : undefined;
	if (cover_image !== undefined) {
	  if (!validateCoverImage(cover_image)) {
	    return res.status(400).json({ message: 'invalid cover_image — must be /uploads/ path' });
	  }
	  // 标准化路径
	  cover_image = cover_image.replace(/\.\./g, '').replace(/\\/g, '/');
	}

    // 标签限制
    const tagList = req.body.tags;
    if (tagList && (!Array.isArray(tagList) || tagList.length > MAX_TAGS)) {
      return res.status(400).json({ message: `max ${MAX_TAGS} tags allowed` });
    }

    const title = req.body.title !== undefined ? sanitizeText(req.body.title, 200) : undefined;
    const excerpt = req.body.excerpt !== undefined ? sanitizeText(req.body.excerpt, 500) : undefined;
    const content = req.body.content !== undefined ? sanitizeContent(req.body.content) : undefined;

    const wordCount = content ? content.replace(/\s/g, '').length : undefined;
    const readTime = wordCount ? Math.max(1, Math.ceil(wordCount / 400)) + ' min read' : undefined;

    const published_at = status === 'published' ? new Date() : null;

    // ====== 单事务：正文 UPDATE + 标签同步 ======
    await conn.beginTransaction();

    // 构建动态 UPDATE
    const fields = {};
    if (title !== undefined)       fields.title = title;
    if (excerpt !== undefined)     fields.excerpt = excerpt;
    if (content !== undefined)     fields.content = content;
    if (status !== undefined)      fields.status = status;
    if (is_pinned !== undefined)   fields.is_pinned = is_pinned;  // 已预处理
    if (readTime !== undefined)    fields.read_time = readTime;
    if (wordCount !== undefined)   fields.word_count = wordCount;
    if (cover_image !== undefined) fields.cover_image = cover_image;
    if (published_at !== null && status === 'published' && !rows[0].published_at) {
      fields.published_at = published_at;
    }

    if (Object.keys(fields).length > 0) {
      const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ');
      await conn.query(
        `UPDATE posts SET ${setClauses} WHERE id = ?`,
        [...Object.values(fields), rows[0].id]
      );
    }

    // 标签更新（同一事务）
    if (tagList && Array.isArray(tagList)) {
      await conn.query('DELETE FROM post_tags WHERE post_id = ?', [rows[0].id]);
      await syncTags(conn, rows[0].id, tagList);
    }

    await conn.commit();

    res.json({ message: 'post updated', slug });
  } catch (err) {
    await conn.rollback();
    console.error('update post error:', err);
    res.status(500).json({ message: 'internal server error' });
  } finally {
    conn.release();
  }
});

// ====== DELETE /api/posts/:slug — 删除文章（作者本人或管理员） ======
router.delete('/:slug', authRequired, authNoGuest, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { slug } = req.params;

    const [rows] = await conn.query('SELECT id, author_id, slug, image_dir FROM posts WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'post not found' });
    }

    // 允许作者本人或 admin 删除
    if (rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'you are not the author' });
    }

    await conn.beginTransaction();

    // 删除文章关联的标签
    await conn.query('DELETE FROM post_tags WHERE post_id = ?', [rows[0].id]);
    // 删除文章
    await conn.query('DELETE FROM posts WHERE id = ?', [rows[0].id]);

    await conn.commit();

    // 尝试删除上传目录（不阻塞数据库操作）
    try {
      const dir = rows[0].image_dir
        ? path.join(__dirname, '../../', rows[0].image_dir)
        : path.join(__dirname, '../../uploads/posts', slug);
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (fsErr) {
      console.warn('Failed to clean up upload directory:', fsErr.message);
    }

    res.json({ message: 'post deleted', slug });
  } catch (err) {
    await conn.rollback();
    console.error('delete post error:', err);
    res.status(500).json({ message: 'internal server error' });
  } finally {
    conn.release();
  }
});

// ====== POST /api/posts/:slug/like — 点赞/取消赞 ======
router.post('/:slug/like', authRequired, authNoGuest, async (req, res) => {
  try {
    const { slug } = req.params;

    const [rows] = await pool.query('SELECT id FROM posts WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'post not found' });
    }

    const postId = rows[0].id;
    const userId = req.user.id;

    // 检查是否已点赞
    const [existing] = await pool.query(
      'SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existing.length > 0) {
      // 取消点赞
      await pool.query('DELETE FROM post_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      const [count] = await pool.query('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?', [postId]);
      return res.json({ liked: false, like_count: count[0]?.count || 0 });
    } else {
      // 点赞
      await pool.query('INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      const [count] = await pool.query('SELECT COUNT(*) AS count FROM post_likes WHERE post_id = ?', [postId]);
      return res.json({ liked: true, like_count: count[0]?.count || 0 });
    }
  } catch (err) {
    console.error('like toggle error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/posts/:slug/comments — 获取评论 ======
router.get('/:slug/comments', async (req, res) => {
  try {
    const { slug } = req.params;

    const [rows] = await pool.query('SELECT id FROM posts WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'post not found' });
    }

    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.parent_id, c.created_at, c.updated_at,
              u.username, u.nickname, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [rows[0].id]
    );

    // 结构化回复（嵌套一层）
    const topLevel = [];
    const replies = {};
    comments.forEach(c => {
      const item = {
        id: c.id,
        content: c.content,
        parent_id: c.parent_id,
        created_at: c.created_at,
        updated_at: c.updated_at,
        author: { username: c.username, nickname: c.nickname, avatar: c.avatar },
      };
      if (c.parent_id) {
        if (!replies[c.parent_id]) replies[c.parent_id] = [];
        replies[c.parent_id].push(item);
      } else {
        topLevel.push({ ...item, replies: [] });
      }
    });

    // 填充回复
    topLevel.forEach(c => {
      c.replies = replies[c.id] || [];
    });

    res.json({ comments: topLevel, total: comments.length });
  } catch (err) {
    console.error('get comments error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/posts/:slug/comments — 发表评论 ======
router.post('/:slug/comments', authRequired, authNoGuest, async (req, res) => {
  try {
    const { slug } = req.params;
    const content = req.body.content || '';
    const parentId = req.body.parent_id ? parseInt(req.body.parent_id) : null;

    if (!content.trim() || content.trim().length < 1) {
      return res.status(400).json({ message: 'comment content is required' });
    }

    // 内容清洗
    const cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/<[^>]*>/g, '')
      .slice(0, 2000)
      .trim();

    if (!cleaned) {
      return res.status(400).json({ message: 'comment content is empty after sanitization' });
    }

    const [rows] = await pool.query('SELECT id FROM posts WHERE slug = ?', [slug]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'post not found' });
    }

    const postId = rows[0].id;

    // 如果是回复，确认父评论存在且属于同一篇文章
    if (parentId) {
      const [parent] = await pool.query('SELECT id, post_id FROM comments WHERE id = ?', [parentId]);
      if (parent.length === 0 || parent[0].post_id !== postId) {
        return res.status(400).json({ message: 'invalid parent comment' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO comments (content, user_id, post_id, parent_id) VALUES (?, ?, ?, ?)',
      [cleaned, req.user.id, postId, parentId]
    );

    const [comment] = await pool.query(
      `SELECT c.id, c.content, c.parent_id, c.created_at, c.updated_at,
              u.username, u.nickname, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'comment posted',
      comment: {
        ...comment[0],
        author: { username: comment[0].username, nickname: comment[0].nickname, avatar: comment[0].avatar },
        replies: [],
      },
    });
  } catch (err) {
    console.error('post comment error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== DELETE /api/posts/:slug/comments/:id — 删除评论 ======
router.delete('/:slug/comments/:id', authRequired, authNoGuest, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);

    const [rows] = await pool.query('SELECT id, user_id FROM comments WHERE id = ?', [commentId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'comment not found' });
    }

    // 只能删除自己的评论或管理员
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'you cannot delete this comment' });
    }

    // CASCADE 会删除子回复
    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);

    res.json({ message: 'comment deleted' });
  } catch (err) {
    console.error('delete comment error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== 辅助：同步标签（单事务内调用） ======
async function syncTags(conn, postId, tagList) {
  for (const item of tagList) {
    const name = sanitizeTag(typeof item === 'string' ? item : item.name || item);
    if (!name) continue;
    // 生成 slug：英文用原名，中文等非英文字符生成短 hash
    let tagSlug = name.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-|-$/g, '');
    if (!tagSlug || tagSlug === '-') {
      // 纯中文或无 ASCII 字符的标签，使用时间戳 hash
      tagSlug = 'tag-' + Date.now().toString(36);
    }

    // upsert tag
    const [existing] = await conn.query('SELECT id FROM tags WHERE name = ?', [name]);
    let tagId;
    if (existing.length > 0) {
      tagId = existing[0].id;
    } else {
      const [inserted] = await conn.query(
        'INSERT INTO tags (name, slug) VALUES (?, ?)',
        [name, tagSlug]
      );
      tagId = inserted.insertId;
    }

    // 关联
    await conn.query(
      'INSERT IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
      [postId, tagId]
    );
  }
}

module.exports = router;
