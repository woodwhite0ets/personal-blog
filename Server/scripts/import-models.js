#!/usr/bin/env node
/**
 * 模型目录导入（服务器上运行）：读 collect-models.mjs 产出的 JSON，覆盖当日快照。
 *
 * 用法：node scripts/import-models.js /tmp/ai-models-2026-10-30.json [--dry-run]
 */
const fs = require('fs');
const pool = require('../src/config/db');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
if (!file) {
  console.error('用法: node scripts/import-models.js <payload.json> [--dry-run]');
  process.exit(1);
}

const toDateOnly = (v) => {
  if (!v) return null;
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

(async () => {
  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const date = toDateOnly(payload.snapshot_date);
  const items = payload.items || [];
  if (!date || items.length === 0) {
    console.error('[models-import] payload 缺 snapshot_date 或 items');
    process.exit(1);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM ai_model_catalog WHERE snapshot_date = ?', [date]);
    const values = items.map((m) => [
      date,
      String(m.model_id).slice(0, 160),
      String(m.name || m.model_id).slice(0, 200),
      Number(m.context_length) || 0,
      m.price_prompt_per_m,
      m.price_completion_per_m,
      String(m.modality || '').slice(0, 80),
      toDateOnly(m.created_at),
    ]);
    await conn.query(
      `INSERT INTO ai_model_catalog
         (snapshot_date, model_id, name, context_length, price_prompt_per_m, price_completion_per_m, modality, released_on)
       VALUES ?`,
      [values]
    );
    if (dryRun) {
      await conn.rollback();
      console.log(`[models-import] --dry-run，已回滚（${values.length} 条）`);
      return;
    }
    await conn.commit();
    console.log(`[models-import] 完成：写入 ${values.length} 条（${date}）`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
})().catch((err) => {
  console.error('[models-import] 失败：', err.message);
  process.exit(1);
});
