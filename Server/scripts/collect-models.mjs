#!/usr/bin/env node
/**
 * 模型目录采集（OpenRouter 公开 API）
 * 只取结构化字段：价格、上下文、模态、上架时间，不抓页面。
 *
 * 用法：node Server/scripts/collect-models.mjs [--out /tmp/ai-models-YYYY-MM-DD.json]
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const stamp = new Date().toISOString().slice(0, 10);
const OUT = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : `/tmp/ai-models-${stamp}.json`;
const API = 'https://openrouter.ai/api/v1/models';

// OpenRouter 用 -1 表示「路由类/可变定价」，这类不是真实单价，统一记 null
const perMillion = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return Number((n * 1e6).toFixed(4));
};

const res = await fetch(API, { headers: { 'User-Agent': 'woodwhite-blog-model-catalog/1.0' } });
if (!res.ok) {
  console.error('[models] 拉取失败：HTTP', res.status);
  process.exit(1);
}
const body = await res.json();
const raw = body.data || [];

const items = raw.map((m) => ({
  model_id: m.id,
  name: m.name || m.id,
  context_length: Number(m.context_length) || 0,
  price_prompt_per_m: perMillion(m.pricing?.prompt),
  price_completion_per_m: perMillion(m.pricing?.completion),
  modality: m.architecture?.modality || '',
  created_at: m.created ? new Date(m.created * 1000).toISOString().slice(0, 10) : null,
}));

const payload = {
  generated_at: new Date().toISOString(),
  snapshot_date: stamp,
  source: 'openrouter',
  count: items.length,
  items,
};
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
console.log(`[models] 写出 ${OUT}（${items.length} 个模型）`);
