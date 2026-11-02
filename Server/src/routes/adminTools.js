const express = require('express');
const pool = require('../config/db');
const { authRequired, authAdmin } = require('../middleware/auth');
const { buildToolUpdate, STATUSES } = require('../utils/toolPatch');

const router = express.Router();

router.use(authRequired, authAdmin);

const escapeLike = (str) => String(str).replace(/[\\%_]/g, '\\$&').slice(0, 100);
const SORTS = {
  weight: 'weight DESC, stars DESC',
  stars: 'stars DESC',
  updated: 'updated_at DESC',
  added: 'added_at DESC',
};

// ====== GET /api/admin/tools — 工具库维护列表 ======
router.get('/', async (req, res) => {
  try {
    const where = [];
    const params = [];

    const status = String(req.query.status || '').trim();
    if (STATUSES.has(status)) {
      where.push('status = ?');
      params.push(status);
    }
    const category = String(req.query.category || '').trim();
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    const q = String(req.query.q || '').trim();
    if (q) {
      const like = `%${escapeLike(q)}%`;
      where.push('(name LIKE ? OR repo LIKE ? OR tagline_zh LIKE ? OR note_zh LIKE ?)');
      params.push(like, like, like, like);
    }

    const sortKey = Object.prototype.hasOwnProperty.call(SORTS, req.query.sort) ? req.query.sort : 'weight';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ai_tools ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT id, slug, repo, name, category, tagline_zh, note_zh, tags, form, pricing,
              needs_key, zh_ui, stars, star_gain_7d, status, weight, source, reviewed_at, updated_at
         FROM ai_tools ${whereSql}
        ORDER BY ${SORTS[sortKey]}
        LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({ total, page, limit, sort: sortKey, items: rows });
  } catch (err) {
    console.error('admin tools list error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== PUT /api/admin/tools/:id — 改分类 / 写评价 / 点精选 / 隐藏 ======
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'invalid id' });

    const parsed = buildToolUpdate(req.body);
    if (!parsed.ok) return res.status(400).json({ message: parsed.error });

    const fields = { ...parsed.fields, reviewed_at: new Date() };
    if (fields.status === 'featured' && !('weight' in fields)) {
      // 新点亮精选时给一个默认权重，避免一上来就沉到底
      fields.weight = 50;
    }

    const cols = Object.keys(fields);
    const sql = `UPDATE ai_tools SET ${cols.map((c) => `\`${c}\` = ?`).join(', ')} WHERE id = ?`;
    const [result] = await pool.query(sql, [...cols.map((c) => fields[c]), id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'not found' });

    const [rows] = await pool.query(
      `SELECT id, slug, name, category, tagline_zh, note_zh, tags, form, pricing,
              needs_key, zh_ui, status, weight, reviewed_at
         FROM ai_tools WHERE id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('admin tools update error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

module.exports = router;
