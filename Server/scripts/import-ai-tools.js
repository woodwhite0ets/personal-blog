#!/usr/bin/env node
/**
 * AI 工具库导入（服务器上运行）
 *
 * 语义与「每日榜单」不同：这是台账，一条工具只占一行。
 *   - 指标（stars / last_commit / desc_en / homepage）每天都刷
 *   - 打标结果（category / tags / tagline_zh / form / pricing / needs_key / zh_ui）只在 status='candidate' 时更新，
 *     一旦人工改过（featured / hidden）就不再被自动流程覆盖
 *   - note_zh / weight / status 永远只由人写
 *
 * 用法：
 *   node scripts/import-ai-tools.js /tmp/ai-tools-2026-11-02.json [--dry-run]
 */
const fs = require('fs');
const pool = require('../src/config/db');
const CATEGORIES = require('../src/config/ai-tool-categories.json');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
if (!file) {
  console.error('用法: node scripts/import-ai-tools.js <payload.json> [--dry-run]');
  process.exit(1);
}

const CAT_KEYS = new Set(CATEGORIES.map((c) => c.key));
const FORMS = new Set(['web', 'desktop', 'cli', 'library', 'model', 'plugin']);
const PRICINGS = new Set(['free', 'freemium', 'paid', 'api']);

const toDateOnly = (v) => {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

const slugify = (repo) =>
  String(repo).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 110);

const clamp = (v, max) => [...String(v == null ? '' : v)].slice(0, max).join('');

(async () => {
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const day = toDateOnly(payload.snapshot_date);
  const candidates = payload.candidates || [];
  if (!day || candidates.length === 0) {
    console.error('[tools-import] payload 缺 snapshot_date 或 candidates');
    process.exit(1);
  }

  const conn = await pool.getConnection();
  let inserted = 0;
  let updated = 0;
  let tagged = 0;
  let skipped = 0;

  try {
    await conn.beginTransaction();

    const [existingRows] = await conn.query('SELECT repo, slug, status FROM ai_tools');
    const byRepo = new Map(existingRows.map((r) => [r.repo, r]));
    const slugs = new Set(existingRows.map((r) => r.slug));

    for (const c of candidates) {
      if (!c || !c.repo) continue;
      const repo = clamp(c.repo, 160);
      const stars = Number(c.stars) || 0;
      const lastCommit = toDateOnly(c.pushed_at);
      const t = c.tool || null;

      // 星数日快照（用于 7 日涨幅，后续也可做趋势）
      await conn.query(
        'INSERT INTO ai_tool_daily (repo, day, stars) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE stars = VALUES(stars)',
        [repo, day, stars]
      );

      // 同步进观察池：工具库和每日榜看的是同一批仓库的星数变化，
      // 进了池子日榜才有它的日增可算（不然新收录的工具永远上不了榜）。
      await conn.query(
        `INSERT INTO ai_repo_seen
           (repo, stars, prev_stars, first_seen, last_seen, repo_created, name, url, desc_en, language, topics, forks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           stars = VALUES(stars), last_seen = VALUES(last_seen),
           name = COALESCE(VALUES(name), name),
           url = COALESCE(VALUES(url), url),
           desc_en = CASE WHEN VALUES(desc_en) <> '' THEN VALUES(desc_en) ELSE desc_en END,
           forks = GREATEST(forks, VALUES(forks))`,
        [
          repo, stars, 0, day, day,
          toDateOnly(c.repo_created),
          clamp(c.name, 160), clamp(c.url, 300), clamp(c.desc_en, 500),
          clamp(c.language, 40), clamp(c.topics, 300), Number(c.forks) || 0,
        ]
      );

      const prev = byRepo.get(repo);
      if (!prev) {
        let slug = slugify(repo) || `tool-${stars}`;
        let n = 2;
        while (slugs.has(slug)) {
          slug = `${slugify(repo).slice(0, 100)}-${n}`;
          n += 1;
        }
        slugs.add(slug);
        await conn.query(
          `INSERT INTO ai_tools
             (slug, repo, name, homepage, desc_en, tagline_zh, category, tags, form,
              open_source, pricing, needs_key, zh_ui, stars, last_commit, status, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, 'candidate', ?)`,
          [
            slug,
            repo,
            clamp(c.name || repo.split('/').pop(), 160),
            c.homepage ? clamp(c.homepage, 300) : null,
            clamp(c.desc_en, 500),
            t ? clamp(t.tagline_zh, 120) : '',
            t && CAT_KEYS.has(t.category) ? t.category : 'other',
            t ? clamp(t.tags, 300) : '',
            t && FORMS.has(t.form) ? t.form : 'web',
            t && PRICINGS.has(t.pricing) ? t.pricing : 'free',
            t && t.needs_key ? 1 : 0,
            t && t.zh_ui ? 1 : 0,
            stars,
            lastCommit,
            clamp(payload.source || 'github-topic', 40),
          ]
        );
        inserted += 1;
        if (t) tagged += 1;
        continue;
      }

      // 已存在：指标总是刷新
      await conn.query(
        `UPDATE ai_tools
            SET stars = ?, last_commit = COALESCE(?, last_commit),
                desc_en = CASE WHEN ? <> '' THEN ? ELSE desc_en END,
                homepage = COALESCE(homepage, ?)
          WHERE repo = ?`,
        [stars, lastCommit, clamp(c.desc_en, 500), clamp(c.desc_en, 500), c.homepage || null, repo]
      );

      // 打标结果只写未被人动过的候选
      if (t && prev.status === 'candidate') {
        await conn.query(
          `UPDATE ai_tools
              SET tagline_zh = ?, category = ?, tags = ?, form = ?, pricing = ?,
                  needs_key = ?, zh_ui = ?
            WHERE repo = ?`,
          [
            clamp(t.tagline_zh, 120),
            CAT_KEYS.has(t.category) ? t.category : 'other',
            clamp(t.tags, 300),
            FORMS.has(t.form) ? t.form : 'web',
            PRICINGS.has(t.pricing) ? t.pricing : 'free',
            t.needs_key ? 1 : 0,
            t.zh_ui ? 1 : 0,
            repo,
          ]
        );
        tagged += 1;
      } else if (!t) {
        skipped += 1;
      }
      updated += 1;
    }

    // 7 日涨幅：拿 7 天前的星数快照对比（没有历史就记 0）
    await conn.query(
      `UPDATE ai_tools t
         JOIN (
           SELECT d.repo, d.stars AS stars7
             FROM ai_tool_daily d
             JOIN (
               SELECT repo, MIN(day) AS day7
                 FROM ai_tool_daily
                WHERE day <= DATE_SUB(?, INTERVAL 7 DAY)
                GROUP BY repo
             ) x ON x.repo = d.repo AND x.day7 = d.day
         ) h ON h.repo = t.repo
          SET t.star_gain_7d = CAST(t.stars AS SIGNED) - CAST(h.stars7 AS SIGNED)`,
      [day]
    );

    if (dryRun) {
      await conn.rollback();
      console.log(`[tools-import] --dry-run，已回滚（新 ${inserted} / 更新 ${updated} / 打标 ${tagged}）`);
      return;
    }
    await conn.commit();
    console.log(
      `[tools-import] 完成 ${day}：新增 ${inserted}，更新 ${updated}，打标写入 ${tagged}，跳过未打标 ${skipped}`
    );
  } catch (err) {
    await conn.rollback();
    console.error('[tools-import] 失败：', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
