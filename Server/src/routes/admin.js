const express = require('express');
const fs = require('fs');
const pool = require('../config/db');
const { authRequired, authAdmin } = require('../middleware/auth');
const { getLogs, clearLogs } = require('../config/logger');

const router = express.Router();

// ====== Caddy 访问日志路径（服务器环境为 /var/log/caddy/blog-access.log） ======
const CADDY_LOG_PATH = process.env.CADDY_LOG_PATH || '/var/log/caddy/blog-access.log';

// 解析 Caddy JSON 日志行 → 简洁对象（供管理面板展示）
function parseCaddyLogLine(line) {
  try {
    const j = JSON.parse(line);
    if (j.logger && j.logger.startsWith('http.log.access') && j.request) {
      const req = j.request;
      const ip = req.client_ip || req.remote_ip || '';
      const ts = new Date(j.ts * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const dur = j.duration ? Math.round(j.duration * 1000) + 'ms' : '';
      return {
        ts,
        level: j.status >= 500 ? 'error' : j.status >= 400 ? 'warn' : 'info',
        message: `${ip} ${req.method} ${req.uri} ${j.status || ''} ${dur}`,
        ip,
        method: req.method,
        uri: req.uri,
        status: j.status,
        duration: j.duration ? Math.round(j.duration * 1000) + 'ms' : '',
      };
    }
    return null;
  } catch {
    return null;
  }
}

// 所有 admin 路由都需要管理员权限
router.use(authRequired, authAdmin);

// ====== GET /api/admin/stats — 仪表盘数据 ======
router.get('/stats', async (req, res) => {
  try {
    const [userResult, postStats, tagResult, recentUsers, recentPosts] = await Promise.all([
      pool.query('SELECT COUNT(*) AS userCount FROM users'),
      pool.query('SELECT status, COUNT(*) AS count FROM posts GROUP BY status'),
      pool.query('SELECT COUNT(*) AS tagCount FROM tags'),
      pool.query('SELECT id, username, nickname, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'),
      pool.query(
        `SELECT p.title, p.slug, p.status, p.published_at, p.created_at, u.username
         FROM posts p JOIN users u ON p.author_id = u.id
         ORDER BY p.created_at DESC LIMIT 5`
      ),
    ]);

    const userCount = userResult[0][0]?.userCount || 0;
    const tagCount = tagResult[0][0]?.tagCount || 0;

    const posts = { total: 0, published: 0, draft: 0, archived: 0 };
    (postStats[0] || []).forEach(r => {
      posts[r.status] = r.count;
      posts.total += r.count;
    });

    res.json({
      users: userCount || 0,
      posts,
      tags: tagCount,
      recent_users: recentUsers[0],
      recent_posts: recentPosts[0].map(p => ({
        ...p,
        author: { username: p.username },
      })),
    });
  } catch (err) {
    console.error('admin stats error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/admin/posts — 文章管理列表 ======
router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = 15;
    const offset = (page - 1) * perPage;
    const status = req.query.status || 'all';
    const search = req.query.search || '';

    let countSql = 'SELECT COUNT(*) AS total FROM posts p JOIN users u ON p.author_id = u.id';
    let dataSql = `
      SELECT p.id, p.title, p.slug, p.excerpt, p.status, p.is_pinned,
             p.read_time, p.word_count, p.published_at, p.created_at,
             u.username, u.nickname
      FROM posts p JOIN users u ON p.author_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (status !== 'all') {
      conditions.push('p.status = ?');
      params.push(status);
    }
    if (search) {
      conditions.push('(p.title LIKE ? OR u.username LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      countSql += where;
      dataSql += where;
    }

    dataSql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';

    const [countResult, [rows]] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, perPage, offset]),
    ]);
    const total = countResult[0][0]?.total || 0;

    // 获取每篇文章的标签
    const postIds = rows.map(r => r.id);
    let tagMap = {};
    if (postIds.length > 0) {
      const [tagRows] = await pool.query(
        `SELECT pt.post_id, t.name
         FROM post_tags pt JOIN tags t ON pt.tag_id = t.id
         WHERE pt.post_id IN (${postIds.map(() => '?').join(',')})`,
        postIds
      );
      tagRows.forEach(t => {
        if (!tagMap[t.post_id]) tagMap[t.post_id] = [];
        tagMap[t.post_id].push(t.name);
      });
    }

    const posts = rows.map(r => ({
      ...r,
      author: { username: r.username, nickname: r.nickname },
      tags: tagMap[r.id] || [],
      date: r.published_at ? r.published_at.toISOString().split('T')[0] : '',
    }));

    res.json({ posts, page, perPage, totalPages: Math.ceil(total / perPage), total });
  } catch (err) {
    console.error('admin posts error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/admin/users — 用户管理列表 ======
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const perPage = 15;
    const offset = (page - 1) * perPage;
    const role = req.query.role || '';
    const search = req.query.search || '';

    let countSql = 'SELECT COUNT(*) AS total FROM users u WHERE 1=1';
    let dataSql = `
      SELECT u.id, u.username, u.nickname, u.email, u.role, u.is_verified, u.created_at,
             (SELECT COUNT(*) FROM posts WHERE author_id = u.id) AS post_count
      FROM users u WHERE 1=1
    `;
    const params = [];

    if (role) {
      countSql += ' AND u.role = ?';
      dataSql += ' AND u.role = ?';
      params.push(role);
    }
    if (search) {
      countSql += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.nickname LIKE ?)';
      dataSql += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.nickname LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    dataSql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';

    const [countResult, [rows]] = await Promise.all([
      pool.query(countSql, params),
      pool.query(dataSql, [...params, perPage, offset]),
    ]);
    const total = countResult[0][0]?.total || 0;

    res.json({ users: rows, page, perPage, totalPages: Math.ceil(total / perPage), total });
  } catch (err) {
    console.error('admin users error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== PUT /api/admin/users/:id — 修改用户（角色/昵称/验证状态） ======
router.put('/users/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);
    const { role, nickname, is_verified } = req.body;

    // 不能改自己
    if (req.user.id === targetId) {
      return res.status(403).json({ message: 'cannot modify your own account' });
    }

    // 如果要降级 admin，确保还有其他 admin
    if (role && role !== 'admin') {
      const [adminCheck] = await pool.query(
        'SELECT COUNT(*) AS admin_count FROM users WHERE role = ? AND id != ?',
        ['admin', targetId]
      );
      const [targetUser] = await pool.query('SELECT role FROM users WHERE id = ?', [targetId]);
      if (targetUser.length > 0 && targetUser[0].role === 'admin' && adminCheck[0][0]?.admin_count === 0) {
        return res.status(400).json({ message: 'cannot remove the last admin' });
      }
    }

    // 验证输入
    if (role && !['admin', 'author', 'reader'].includes(role)) {
      return res.status(400).json({ message: 'invalid role' });
    }
    if (nickname !== undefined) {
      if (typeof nickname !== 'string' || nickname.length === 0 || nickname.length > 50) {
        return res.status(400).json({ message: 'nickname must be 1-50 chars' });
      }
    }

    const fields = {};
    if (role !== undefined) fields.role = role;
    if (nickname !== undefined) fields.nickname = nickname.replace(/<[^>]*>/g, '').slice(0, 50).trim();
    if (is_verified !== undefined) fields.is_verified = is_verified ? 1 : 0;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'no fields to update' });
    }

    const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await pool.query(
      `UPDATE users SET ${setClauses} WHERE id = ?`,
      [...Object.values(fields), targetId]
    );

    const [updated] = await pool.query(
      'SELECT id, username, nickname, role, is_verified FROM users WHERE id = ?',
      [targetId]
    );

    res.json({ message: 'user updated', user: updated[0] });
  } catch (err) {
    console.error('admin update user error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== DELETE /api/admin/users/:id — 删除用户 ======
router.delete('/users/:id', async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);

    // 不能删自己
    if (req.user.id === targetId) {
      return res.status(403).json({ message: 'cannot delete your own account' });
    }

    // 确认目标用户存在
    const [rows] = await pool.query('SELECT id, username, role FROM users WHERE id = ?', [targetId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    // 如果是 admin，确保还有其他 admin
    if (rows[0].role === 'admin') {
      const [adminCheck] = await pool.query('SELECT COUNT(*) AS admin_count FROM users WHERE role = ? AND id != ?', ['admin', targetId]);
      if (adminCheck[0][0]?.admin_count === 0) {
        return res.status(400).json({ message: 'cannot delete the last admin' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = ?', [targetId]);

    res.json({ message: `user @${rows[0].username} deleted` });
  } catch (err) {
    console.error('admin delete user error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/admin/logs — 查看服务器日志 ======
router.get('/logs', async (req, res) => {
  try {
    const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit) || 500));
    const level = req.query.level || '';
    const logs = getLogs(limit, level || undefined);
    res.json({ logs, total: logs.length });
  } catch (err) {
    console.error('admin logs error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== DELETE /api/admin/logs — 清空日志 ======
router.delete('/logs', async (req, res) => {
  try {
    clearLogs();
    res.json({ message: 'logs cleared' });
  } catch (err) {
    console.error('admin clear logs error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/admin/logs/caddy — 查看 Caddy 访问日志 ======
router.get('/logs/caddy', async (req, res) => {
  try {
    const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit) || 500));
    const includeAdmin = req.query.include_admin === '1';  // 前端「显示管理员日志」开关
    if (!fs.existsSync(CADDY_LOG_PATH)) {
      return res.json({ logs: [], total: 0, source: 'caddy' });
    }
    const raw = fs.readFileSync(CADDY_LOG_PATH, 'utf8');
    const lines = raw.split('\n').filter(Boolean).slice(-limit);
    // 默认过滤管理员访问控制台的请求（/api/admin/* 只有管理员能访问），避免日志被自己的操作刷屏
    const logs = lines
      .map(parseCaddyLogLine)
      .filter(Boolean)
      .filter(l => includeAdmin || !l.uri.startsWith('/api/admin/'));
    res.json({ logs, total: logs.length, source: 'caddy' });
  } catch (err) {
    console.error('admin caddy logs error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

module.exports = router;
