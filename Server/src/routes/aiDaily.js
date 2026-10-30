const express = require('express');
const pool = require('../config/db');

const router = express.Router();

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

// ====== 潜力 / 成熟分组判据 ======
const MATURE_STARS = 30000;        // 成熟线：总 Star
const MATURE_AGE_DAYS = 365;       // 成熟线：仓库至少一岁
const EMERGING_MIN_APPEAR = 2;     // 潜力线：观察窗口内至少上榜次数
const ANALYSIS_LIMIT = 8;          // 每组最多返回条数
const ANALYSIS_MAX_DAYS = 30;      // 观察窗口上限

// 榜单条目的对外字段（首页简讯与完整榜单共用）
const ITEM_FIELDS = `
  rank_no AS \`rank\`,
  repo,
  name,
  url,
  desc_zh,
  desc_en,
  language,
  stars,
  star_gain,
  topics,
  first_seen,
  pushed_at
`;

function clampLimit(raw, fallback = DEFAULT_LIMIT) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_LIMIT);
}

function isDateLike(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// 当天榜单的最新发布时间（用于页头「更新于」）
async function resolveDate(requested) {
  if (isDateLike(requested)) return requested;
  const [[row]] = await pool.query('SELECT MAX(snapshot_date) AS d FROM ai_daily_items');
  if (!row || !row.d) return null;
  // driver 可能返回 Date，统一成 YYYY-MM-DD
  return row.d instanceof Date ? row.d.toISOString().slice(0, 10) : String(row.d).slice(0, 10);
}

// ====== GET /api/ai-daily — 某日榜单（默认最新） ======
router.get('/', async (req, res) => {
  try {
    const date = await resolveDate(req.query.date);
    if (!date) {
      return res.json({ date: null, items: [], total: 0, message: '榜单尚未生成' });
    }
    const limit = clampLimit(req.query.limit);
    const [items] = await pool.query(
      `SELECT ${ITEM_FIELDS} FROM ai_daily_items WHERE snapshot_date = ? ORDER BY rank_no ASC LIMIT ?`,
      [date, limit]
    );
    const [[meta]] = await pool.query(
      'SELECT COUNT(*) AS total, MAX(created_at) AS updated_at FROM ai_daily_items WHERE snapshot_date = ?',
      [date]
    );
    res.json({
      date,
      updatedAt: meta.updated_at || null,
      total: meta.total,
      items,
    });
  } catch (err) {
    console.error('ai-daily error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/ai-daily/latest — 首页简讯（轻量字段） ======
router.get('/latest', async (req, res) => {
  try {
    const date = await resolveDate(null);
    if (!date) return res.json({ date: null, items: [] });
    const limit = clampLimit(req.query.limit, 3);
    const [items] = await pool.query(
      `SELECT rank_no AS \`rank\`, name, repo, url, desc_zh, desc_en, language, star_gain, stars
       FROM ai_daily_items WHERE snapshot_date = ? ORDER BY rank_no ASC LIMIT ?`,
      [date, limit]
    );
    res.json({ date, items });
  } catch (err) {
    console.error('ai-daily latest error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/ai-daily/weekly — 最近 N 天聚合（周报用）======
router.get('/weekly', async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 2), 30);
    const limit = clampLimit(req.query.limit, 8);
    const [[span]] = await pool.query(
      `SELECT MIN(snapshot_date) AS first, MAX(snapshot_date) AS last,
              COUNT(DISTINCT snapshot_date) AS snapshots
         FROM ai_daily_items
        WHERE snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      [days]
    );
    if (!span || !span.first) {
      return res.json({ days, snapshots: 0, items: [], from: null, to: null });
    }
    const [rows] = await pool.query(
      // ONLY_FULL_GROUP_BY 下，非聚合列必须包一层（同一 repo 的这些字段实际上一致）
      `SELECT repo,
              MAX(name) AS name,
              MAX(url) AS url,
              MAX(language) AS language,
              COUNT(*) AS hits,
              SUM(star_gain) AS gain,
              MAX(stars) AS stars,
              MIN(snapshot_date) AS first_seen,
              MAX(snapshot_date) AS last_seen,
              SUBSTRING_INDEX(GROUP_CONCAT(desc_zh ORDER BY snapshot_date DESC SEPARATOR '\n'), '\n', 1) AS desc_zh,
              SUBSTRING_INDEX(GROUP_CONCAT(desc_en ORDER BY snapshot_date DESC SEPARATOR '\n'), '\n', 1) AS desc_en,
              MAX(topics) AS topics
         FROM ai_daily_items
        WHERE snapshot_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY repo
        ORDER BY gain DESC, hits DESC, stars DESC
        LIMIT ?`,
      [days, limit]
    );
    const fmt = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v || '').slice(0, 10));
    res.json({
      days,
      snapshots: span.snapshots,
      from: fmt(span.first),
      to: fmt(span.last),
      items: rows.map((r, i) => ({
        rank: i + 1,
        repo: r.repo,
        name: r.name,
        url: r.url,
        language: r.language || '',
        hits: Number(r.hits),
        gain: Number(r.gain || 0),
        stars: Number(r.stars || 0),
        firstSeen: fmt(r.first_seen),
        lastSeen: fmt(r.last_seen),
        desc_zh: r.desc_zh || '',
        desc_en: r.desc_en || '',
        topics: r.topics || '',
      })),
    });
  } catch (err) {
    console.error('ai-daily weekly error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/ai-daily/dates — 归档日期列表 ======
router.get('/dates', async (req, res) => {
  try {
    const limit = clampLimit(req.query.limit, 30);
    const [rows] = await pool.query(
      `SELECT snapshot_date AS date, COUNT(*) AS count, MAX(created_at) AS updated_at
       FROM ai_daily_items GROUP BY snapshot_date ORDER BY snapshot_date DESC LIMIT ?`,
      [limit]
    );
    res.json({
      dates: rows.map((r) => ({
        date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
        count: r.count,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error('ai-daily dates error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});
// ====== GET /api/ai-daily/analysis — 潜力项目 / 成熟项目分析 ======
// 判据：
//   成熟 = 总 Star >= MATURE_STARS 且 仓库年龄 >= MATURE_AGE_DAYS（年龄未知时按 Star 兜底）
//   潜力 = 非成熟，且观察窗口内上榜次数 >= EMERGING_MIN_APPEAR
//   排序：成熟按窗口累计增星；潜力按相对增速 momentum = 累计增星 / 当前星数
router.get('/analysis', async (req, res) => {
  try {
    const parsed = parseInt(req.query.days, 10);
    const days = Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, ANALYSIS_MAX_DAYS)
      : 7;

    const date = await resolveDate(null);
    if (!date) {
      return res.json({
        date: null, days,
        criteria: { matureStars: MATURE_STARS, matureAgeDays: MATURE_AGE_DAYS, emergingMinAppear: EMERGING_MIN_APPEAR },
        mature: [], emerging: [], message: '榜单尚未生成',
      });
    }

    const [rows] = await pool.query(
      `SELECT snapshot_date, repo, name, url, desc_zh, desc_en, language, topics,
              stars, star_gain, repo_created, pushed_at
       FROM ai_daily_items
       WHERE snapshot_date > DATE_SUB(?, INTERVAL ? DAY) AND snapshot_date <= ?
       ORDER BY snapshot_date DESC`,
      [date, days, date]
    );

    const byRepo = new Map();
    for (const r of rows) {
      const snap = r.snapshot_date instanceof Date
        ? r.snapshot_date.toISOString().slice(0, 10)
        : String(r.snapshot_date).slice(0, 10);
      const cur = byRepo.get(r.repo);
      if (!cur) {
        byRepo.set(r.repo, {
          repo: r.repo,
          name: r.name,
          url: r.url,
          desc: r.desc_zh || r.desc_en || '',
          language: r.language || '',
          topics: r.topics || '',
          stars: Number(r.stars) || 0,
          gain: Number(r.star_gain) || 0,
          appearances: 1,
          latestGain: Number(r.star_gain) || 0,
          latestDate: snap,
          repoCreated: r.repo_created ? String(r.repo_created).slice(0, 10) : null,
          pushedAt: r.pushed_at || null,
        });
      } else {
        cur.gain += Number(r.star_gain) || 0;
        cur.appearances += 1;
        if ((Number(r.stars) || 0) > cur.stars) cur.stars = Number(r.stars) || 0;
        if (!cur.repoCreated && r.repo_created) cur.repoCreated = String(r.repo_created).slice(0, 10);
      }
    }

    const today = new Date(date + 'T00:00:00Z');
    const items = [...byRepo.values()].map((it) => {
      const ageDays = it.repoCreated
        ? Math.max(0, Math.round((today - new Date(it.repoCreated + 'T00:00:00Z')) / 86400000))
        : null;
      const momentumPct = it.stars > 0 ? (it.gain / it.stars) * 100 : 0;
      const active = it.pushedAt
        ? (today - new Date(it.pushedAt)) / 86400000 <= 7
        : false;
      const mature = it.stars >= MATURE_STARS && (ageDays === null || ageDays >= MATURE_AGE_DAYS);
      return {
        ...it,
        ageDays,
        momentumPct: Number(momentumPct.toFixed(2)),
        active,
        tier: mature ? 'mature' : 'emerging',
      };
    });

    const mature = items
      .filter((it) => it.tier === 'mature')
      .sort((a, b) => b.gain - a.gain || b.stars - a.stars)
      .slice(0, ANALYSIS_LIMIT);

    const emerging = items
      .filter((it) => it.tier === 'emerging' && it.appearances >= EMERGING_MIN_APPEAR)
      .sort((a, b) => b.momentumPct - a.momentumPct || b.gain - a.gain)
      .slice(0, ANALYSIS_LIMIT);

    res.json({
      date,
      days,
      from: null,
      criteria: {
        matureStars: MATURE_STARS,
        matureAgeDays: MATURE_AGE_DAYS,
        emergingMinAppear: EMERGING_MIN_APPEAR,
      },
      totals: { candidates: items.length, mature: mature.length, emerging: emerging.length },
      mature,
      emerging,
    });
  } catch (err) {
    console.error('ai-daily analysis error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});
// ====== GET /api/ai-daily/insights — 榜单侧写（语言/主题/新鲜度/异动）======
// 全部基于观察窗口内的快照，不引入外部数据源。
router.get('/insights', async (req, res) => {
  try {
    const parsed = parseInt(req.query.days, 10);
    const days = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, ANALYSIS_MAX_DAYS) : 7;
    const date = await resolveDate(null);
    if (!date) return res.json({ date: null, days, message: '榜单尚未生成' });

    const [rows] = await pool.query(
      `SELECT snapshot_date, rank_no, repo, language, topics, stars, star_gain, first_seen
       FROM ai_daily_items
       WHERE snapshot_date > DATE_SUB(?, INTERVAL ? DAY) AND snapshot_date <= ?
       ORDER BY snapshot_date ASC`,
      [date, days, date]
    );

    const dayOf = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v).slice(0, 10));
    const repos = new Map();
    const perDay = new Map();

    for (const r of rows) {
      const d = dayOf(r.snapshot_date);
      if (!perDay.has(d)) perDay.set(d, { date: d, items: 0, gain: 0, repos: new Set() });
      const day = perDay.get(d);
      day.items += 1;
      day.gain += Number(r.star_gain) || 0;
      day.repos.add(r.repo);

      const cur = repos.get(r.repo) || {
        repo: r.repo, language: r.language || '', topics: r.topics || '',
        stars: 0, gain: 0, appearances: 0, firstRank: null, lastRank: null,
        bestDayGain: 0, bestDayDate: d, firstSeen: r.first_seen ? dayOf(r.first_seen) : null,
      };
      cur.stars = Math.max(cur.stars, Number(r.stars) || 0);
      cur.gain += Number(r.star_gain) || 0;
      cur.appearances += 1;
      if (cur.firstRank === null) cur.firstRank = r.rank_no;
      cur.lastRank = r.rank_no;
      const g = Number(r.star_gain) || 0;
      if (g > cur.bestDayGain) { cur.bestDayGain = g; cur.bestDayDate = d; }
      if (!cur.language && r.language) cur.language = r.language;
      repos.set(r.repo, cur);
    }

    const list = [...repos.values()].map((it) => ({
      ...it,
      momentumPct: it.stars > 0 ? Number(((it.gain / it.stars) * 100).toFixed(2)) : 0,
      rankDelta: it.firstRank !== null && it.lastRank !== null ? it.firstRank - it.lastRank : 0,
    }));

    // 语言分布
    const langMap = new Map();
    for (const it of list) {
      const key = it.language || '未标注';
      const cur = langMap.get(key) || { language: key, count: 0, gain: 0, momentumSum: 0 };
      cur.count += 1;
      cur.gain += it.gain;
      cur.momentumSum += it.momentumPct;
      langMap.set(key, cur);
    }
    const languages = [...langMap.values()]
      .map((l) => ({ ...l, avgMomentumPct: Number((l.momentumSum / l.count).toFixed(2)), momentumSum: undefined }))
      .sort((a, b) => b.count - a.count || b.gain - a.gain)
      .slice(0, 8);

    // 主题标签
    const topicMap = new Map();
    for (const it of list) {
      for (const t of (it.topics || '').split(',').map((x) => x.trim()).filter(Boolean)) {
        const cur = topicMap.get(t) || { topic: t, count: 0, gain: 0 };
        cur.count += 1;
        cur.gain += it.gain;
        topicMap.set(t, cur);
      }
    }
    const topics = [...topicMap.values()]
      .sort((a, b) => b.count - a.count || b.gain - a.gain)
      .slice(0, 10);

    // 新鲜度：按「首次出现日期」分组统计，避免早期数据不足时出现 100% 的误导
    const windowStart = new Date(new Date(date + 'T00:00:00Z').getTime() - days * 86400000)
      .toISOString().slice(0, 10);
    const freshMap = new Map();
    for (const it of list) {
      if (!it.firstSeen) continue;
      freshMap.set(it.firstSeen, (freshMap.get(it.firstSeen) || 0) + 1);
    }
    const firstSeenDaily = [...freshMap.entries()]
      .map(([d, count]) => ({ date: d, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const freshRepos = list.filter((it) => it.firstSeen && it.firstSeen >= windowStart);
    const [[archiveRow]] = await pool.query('SELECT MIN(snapshot_date) AS d FROM ai_daily_items');
    const archiveStart = archiveRow && archiveRow.d
      ? (archiveRow.d instanceof Date ? archiveRow.d.toISOString().slice(0, 10) : String(archiveRow.d).slice(0, 10))
      : null;
    const daily = [...perDay.values()]
      .map((d) => ({ date: d.date, items: d.items, gain: d.gain, repos: d.repos.size }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const risers = [...list]
      .filter((it) => it.rankDelta !== 0)
      .sort((a, b) => b.rankDelta - a.rankDelta)
      .slice(0, 5)
      .map((it) => ({ repo: it.repo, from: it.firstRank, to: it.lastRank, delta: it.rankDelta }));

    const fastGainers = [...list]
      .sort((a, b) => b.momentumPct - a.momentumPct)
      .slice(0, 5)
      .map((it) => ({ repo: it.repo, momentumPct: it.momentumPct, gain: it.gain, stars: it.stars }));

    const slowest = [...list]
      .filter((it) => it.appearances >= 2)
      .sort((a, b) => a.momentumPct - b.momentumPct)
      .slice(0, 5)
      .map((it) => ({ repo: it.repo, momentumPct: it.momentumPct, gain: it.gain, stars: it.stars }));

    const streaks = [...list]
      .sort((a, b) => b.appearances - a.appearances || b.gain - a.gain)
      .slice(0, 5)
      .map((it) => ({ repo: it.repo, appearances: it.appearances, gain: it.gain }));

    const biggestDay = list.reduce(
      (best, it) => (it.bestDayGain > (best?.bestDayGain || 0) ? it : best),
      null
    );

    res.json({
      date,
      days,
      archiveStart,
      windowStart,
      totals: {
        snapshots: daily.length,
        distinctRepos: list.length,
        freshRepos: freshRepos.length,
        freshRatioPct: list.length ? Number(((freshRepos.length / list.length) * 100).toFixed(1)) : 0,
        totalGain: list.reduce((s, it) => s + it.gain, 0),
      },
      daily,
      firstSeenDaily,
      languages,
      topics,
      risers,
      fastGainers,
      slowest,
      streaks,
      biggestDay: biggestDay
        ? { repo: biggestDay.repo, gain: biggestDay.bestDayGain, date: biggestDay.bestDayDate }
        : null,
    });
  } catch (err) {
    console.error('ai-daily insights error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});
// ====== GET /api/ai-daily/geek — 极客项目池 ======
// 数据来自观察池（ai_repo_seen）：极客向查询（homelab/tui/embedded/zig/fpga…）收集，
// 星数限制在 GEEK 区间内，按最近一次采集的日增速排序。
const GEEK_MIN = 120;
const GEEK_MAX = 8000;
const GEEK_LIMIT = 15;

router.get('/geek', async (req, res) => {
  try {
    const parsed = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 40) : GEEK_LIMIT;

    const [[latest]] = await pool.query(
      'SELECT MAX(last_seen) AS d FROM ai_repo_seen WHERE is_geek = 1'
    );
    if (!latest || !latest.d) {
      return res.json({ date: null, items: [], message: '极客池还没有数据（等采集任务跑一次）' });
    }
    const lastSeen = latest.d instanceof Date
      ? latest.d.toISOString().slice(0, 10)
      : String(latest.d).slice(0, 10);

    const [rows] = await pool.query(
      `SELECT repo, name, url, desc_zh, desc_en, language, topics, stars, prev_stars,
              forks, repo_created, first_seen, last_seen
       FROM ai_repo_seen
       WHERE is_geek = 1 AND stars BETWEEN ? AND ? AND last_seen >= DATE_SUB(?, INTERVAL 7 DAY)`,
      [GEEK_MIN, GEEK_MAX, lastSeen]
    );

    const today = new Date(lastSeen + 'T00:00:00Z');
    const items = rows.map((r) => {
      const stars = Number(r.stars) || 0;
      const gain = Math.max(0, stars - (Number(r.prev_stars) || 0));
      const ageDays = r.repo_created
        ? Math.max(0, Math.round((today - new Date(String(r.repo_created).slice(0, 10) + 'T00:00:00Z')) / 86400000))
        : null;
      return {
        repo: r.repo,
        name: r.name || r.repo.split('/')[1] || r.repo,
        url: r.url || ('https://github.com/' + r.repo),
        desc: r.desc_zh || r.desc_en || '',
        language: r.language || '',
        topics: r.topics || '',
        stars,
        gain,
        forks: Number(r.forks) || 0,
        momentumPct: stars > 0 ? Number(((gain / stars) * 100).toFixed(2)) : 0,
        ageDays,
        firstSeen: r.first_seen ? String(r.first_seen).slice(0, 10) : null,
      };
    }).sort((a, b) => b.momentumPct - a.momentumPct || b.gain - a.gain || b.stars - a.stars);

    res.json({
      date: lastSeen,
      range: { minStars: GEEK_MIN, maxStars: GEEK_MAX },
      poolSize: rows.length,
      items: items.slice(0, limit),
    });
  } catch (err) {
    console.error('ai-daily geek error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

module.exports = router;
