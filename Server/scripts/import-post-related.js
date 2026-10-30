#!/usr/bin/env node
/**
 * 导入「语义相关文章」到服务器（读 build-post-related.mjs 产出的 JSON）。
 * 用法：node scripts/import-post-related.js /tmp/post-related.json
 */
const fs = require('fs');
const pool = require('../src/config/db');

async function main() {
  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error('用法: node scripts/import-post-related.js <payload.json>');
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const items = payload.items || [];
  if (!items.length) { console.error('payload 里没有 items'); process.exit(1); }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM post_related');
    const rows = [];
    for (const it of items) {
      for (const r of it.related || []) {
        rows.push([it.post_slug.slice(0, 200), r.slug.slice(0, 200), r.rank_no, r.score]);
      }
    }
    if (rows.length) {
      await conn.query('INSERT INTO post_related (post_slug, related_slug, rank_no, score) VALUES ?', [rows]);
    }
    await conn.commit();
    console.log(`[import] ${items.length} 篇 → ${rows.length} 条相关关系`);
    const [check] = await conn.query('SELECT post_slug, COUNT(*) c FROM post_related GROUP BY post_slug LIMIT 3');
    console.log('[import] 抽样:', check.map((x) => `${String(x.post_slug).slice(0, 20)}…(${x.c})`).join(' '));
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((e) => { console.error('[import] 失败:', e.message); process.exit(1); });
