const express = require('express');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { authRequired, authOptional } = require('../middleware/auth');

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

    // status=all 仅 admin 可用
    if (status === 'all' && (!req.user || req.user.role !== 'admin')) {
      status = 'published';
    }

    // 构建查询
    let countSql = 'SELECT COUNT(*) AS total FROM posts p JOIN users u ON p.author_id = u.id';
    let dataSql   = `
      SELECT
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
    }

    const posts = rows.map(r => ({
      ...r,
      author: { username: r.username, nickname: r.nickname, avatar: r.avatar },
      tags: tagMap[r.id] || [],
      tag: tagMap[r.id]?.[0]?.name || 'uncategorized',  // 兼容前端旧逻辑
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
router.get('/:slug', async (req, res) => {
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

    // 获取标签
    const [tagRows] = await pool.query(
      `SELECT t.name, t.slug
       FROM post_tags pt
       JOIN tags t ON pt.tag_id = t.id
       WHERE pt.post_id = ?`,
      [p.id]
    );

    const post = {
      ...p,
      author: { username: p.username, nickname: p.nickname, bio: p.bio, avatar: p.avatar },
      tags: tagRows,
      tag: tagRows[0]?.name || 'uncategorized',
      date: p.published_at ? p.published_at.toISOString().split('T')[0] : '',
    };

    res.json({ post });
  } catch (err) {
    console.error('get post error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/posts — 创建文章 ======
router.post('/', authRequired, async (req, res) => {
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
router.put('/:slug', authRequired, async (req, res) => {
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

    // 仅管理员可置顶
    const is_pinned = req.body.is_pinned && req.user.role === 'admin' ? 1 : 0;

    // 校验 cover_image
    const cover_image = req.body.cover_image !== undefined ? req.body.cover_image : undefined;
    if (cover_image !== undefined && !validateCoverImage(cover_image)) {
      return res.status(400).json({ message: 'invalid cover_image — must be /uploads/ path' });
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
router.delete('/:slug', authRequired, async (req, res) => {
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

// ====== 辅助：同步标签（单事务内调用） ======
async function syncTags(conn, postId, tagList) {
  for (const item of tagList) {
    const name = sanitizeTag(typeof item === 'string' ? item : item.name || item);
    if (!name) continue;
    const tagSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!tagSlug) continue;

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
