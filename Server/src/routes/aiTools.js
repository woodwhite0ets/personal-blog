const express = require('express');
const pool = require('../config/db');
const CATEGORIES = require('../config/ai-tool-categories.json');

const router = express.Router();

// LIKE 通配符转义（与 posts.js / admin.js 保持一致）
const escapeLike = (s) => String(s).replace(/[\\%_]/g, (m) => `\\${m}`);

const CAT_LABEL = new Map(CATEGORIES.map((c) => [c.key, c.label]));
const FORMS = new Set(['web', 'desktop', 'cli', 'library', 'model', 'plugin']);
const SORTS = {
  featured: 't.weight DESC, t.stars DESC',
  stars: 't.stars DESC',
  gain: 't.star_gain_7d DESC, t.stars DESC',
  new: 't.added_at DESC, t.stars DESC',
};

function shape(row) {
  const labels = String(row.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return {
    slug: row.slug,
    name: row.name,
    repo: row.repo,
    url: row.url,
    homepage: row.homepage,
    tagline_zh: row.tagline_zh || '',
    note_zh: row.note_zh || null,
    desc_en: row.desc_en || '',
    category: row.category,
    category_label: CAT_LABEL.get(row.category) || '其他',
    tags: labels,
    form: row.form,
    open_source: !!row.open_source,
    pricing: row.pricing,
    needs_key: !!row.needs_key,
    zh_ui: !!row.zh_ui,
    stars: row.stars,
    star_gain_7d: row.star_gain_7d,
    last_commit: row.last_commit,
    featured: row.status === 'featured',
  };
}

// ====== GET /api/ai-tools — 工具库列表（搜索 / 分类 / 筛选 / 排序）======
// 默认出全部（候选池），?mode=featured 只看站长精选。
router.get('/', async (req, res) => {
  try {
    const mode = req.query.mode === 'featured' ? 'featured' : 'all';
    const where = [];
    const params = [];

    if (mode === 'all') {
      where.push("t.status <> 'hidden'");
    } else {
      where.push("t.status = 'featured'");
    }

    const category = String(req.query.category || '').trim();
    if (category && CAT_LABEL.has(category)) {
      where.push('t.category = ?');
      params.push(category);
    }

    const q = String(req.query.q || '').trim();
    if (q) {
      const like = `%${escapeLike(q)}%`;
      where.push('(t.name LIKE ? OR t.repo LIKE ? OR t.tagline_zh LIKE ? OR t.desc_en LIKE ? OR t.tags LIKE ?)');
      params.push(like, like, like, like, like);
    }

    if (req.query.free === '1') where.push("t.pricing IN ('free','freemium')");
    if (req.query.no_key === '1') where.push('t.needs_key = 0');
    if (req.query.zh_ui === '1') where.push('t.zh_ui = 1');
    const form = String(req.query.form || '').trim();
    if (FORMS.has(form)) {
      where.push('t.form = ?');
      params.push(form);
    }

    const sortKey = Object.prototype.hasOwnProperty.call(SORTS, req.query.sort) ? req.query.sort : 'featured';
    const orderBy = SORTS[sortKey];

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 24, 1), 60);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const offset = (page - 1) * limit;

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM ai_tools t ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT t.*, COALESCE(t.homepage, CONCAT('https://github.com/', t.repo)) AS url
         FROM ai_tools t ${whereSql}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 分类计数不受 mode 影响：精选还很少时 chips 也不会整排消失，导航才一直可用
    const [catRows] = await pool.query(
      `SELECT t.category, COUNT(*) AS n
         FROM ai_tools t
        WHERE t.status <> 'hidden'
        GROUP BY t.category`
    );
    const catCount = new Map(catRows.map((r) => [r.category, Number(r.n)]));
    const categories = CATEGORIES
      .map((c) => ({ key: c.key, label: c.label, count: catCount.get(c.key) || 0 }))
      .filter((c) => c.count > 0);

    res.json({
      mode,
      total,
      page,
      limit,
      sort: sortKey,
      categories,
      items: rows.map(shape),
    });
  } catch (err) {
    console.error('ai-tools list error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/ai-tools/:slug — 工具详情 ======
router.get('/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(404).json({ message: 'not found' });

    const [rows] = await pool.query(
      `SELECT t.*, COALESCE(t.homepage, CONCAT('https://github.com/', t.repo)) AS url
         FROM ai_tools t
        WHERE t.slug = ? AND t.status <> 'hidden'
        LIMIT 1`,
      [slug]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'not found' });

    const item = shape(rows[0]);

    // 上过榜的日期（和每日 AI 榜互链）
    let onBoard = [];
    if (item.repo) {
      const [boardRows] = await pool.query(
        'SELECT snapshot_date, rank_no FROM ai_daily_items WHERE repo = ? ORDER BY snapshot_date DESC LIMIT 8',
        [item.repo]
      );
      onBoard = boardRows.map((r) => ({ date: r.snapshot_date, rank: r.rank_no }));
    }

    res.json({ ...item, on_board: onBoard });
  } catch (err) {
    console.error('ai-tools detail error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

module.exports = router;
