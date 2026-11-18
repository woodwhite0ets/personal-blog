#!/usr/bin/env node
/**
 * harness 用量导入：读 collect-harnesses.mjs 产出的 JSON，覆盖当日快照。
 *
 * 用法：node scripts/import-harnesses.js /tmp/ai-harnesses-2026-11-13.json [--dry-run]
 */
const fs = require('fs');
const pool = require('../src/config/db');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
if (!file) {
  console.error('用法: node scripts/import-harnesses.js <payload.json> [--dry-run]');
  process.exit(1);
}

const toDateOnly = (v) => {
  if (!v) return null;
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};
const clamp = (s, n) => String(s == null ? '' : s).slice(0, n);

(async () => {
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const date = toDateOnly(payload.snapshot_date);
  const boards = { popular: payload.popular || [], trending: payload.trending || [] };
  const total = boards.popular.length + boards.trending.length;
  if (!date || total === 0) {
    console.error('[harness-import] payload 缺 snapshot_date 或两个榜都是空的');
    process.exit(1);
  }

  const rows = [];
  for (const [board, list] of Object.entries(boards)) {
    list.forEach((r, i) => {
      const slug = clamp(r.slug || r.title, 120);
      if (!slug) return;
      rows.push([
        date,
        board,
        Number(r.rank) || i + 1,
        slug,
        clamp(r.title, 160),
        clamp(r.url, 255),
        Number(r.tokens) || 0,
        Number(r.requests) || 0,
        r.growth == null ? null : Number(r.growth),
      ]);
    });
  }

  if (dryRun) {
    console.log(`[harness-import] dry-run：${date} popular ${boards.popular.length} / trending ${boards.trending.length}`);
    console.log(rows.slice(0, 5));
    process.exit(0);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM ai_harness_stats WHERE snapshot_date = ?', [date]);
    const sql = `INSERT INTO ai_harness_stats
        (snapshot_date, board, rank_no, app_slug, title, url, tokens, requests, growth_pct)
       VALUES ?`;
    for (let i = 0; i < rows.length; i += 200) {
      await conn.query(sql, [rows.slice(i, i + 200)]);
    }
    await conn.commit();
    console.log(`[harness-import] ${date} 写入 ${rows.length} 行（popular ${boards.popular.length} / trending ${boards.trending.length}）`);
  } catch (err) {
    await conn.rollback();
    console.error('[harness-import] 失败：', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
