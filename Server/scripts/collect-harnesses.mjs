#!/usr/bin/env node
/**
 * harness 用量采集（OpenRouter /apps 公开榜）
 *
 * OpenRouter 没有给这份数据开 JSON 接口，页面是 Next.js 流式渲染，
 * 数据以 RSC payload（self.__next_f.push）内嵌在 HTML 里。这里把它解出来，
 * 只取两个榜：
 *   popular  —— 按累计 token 量排的 harness / 客户端
 *   trending —— 按近期增速排的 harness，带 growthPercent
 *
 * 只取公开字段（名称、slug、token、请求数、排名、增速），不抓描述与图标。
 *
 * 用法：node Server/scripts/collect-harnesses.mjs [--out /tmp/ai-harnesses-YYYY-MM-DD.json]
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const stamp = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const OUT = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : `/tmp/ai-harnesses-${stamp}.json`;
const PAGE = 'https://openrouter.ai/apps';
const UA = 'woodwhite-blog-harness-stats/1.0';

/** 把页面里的 RSC payload 拼回一整串可读文本 */
function decodePayload(html) {
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)].map((m) => m[1]);
  return chunks
    .map((raw) => {
      try { return JSON.parse(raw); } catch { return ''; }
    })
    .join('');
}

/** 从 pos 处的 `{` 开始按括号配平，取出一个完整 JSON 对象的原文 */
function takeObject(text, pos) {
  let depth = 0, inStr = false, esc = false;
  for (let i = pos; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(pos, i + 1);
    }
  }
  return null;
}

/** 扫全文，把所有形如 {"app_id":…,"total_tokens":…} 的记录解出来 */
function scanRecords(text, marker) {
  const out = [];
  let at = text.indexOf(marker);
  while (at >= 0) {
    const raw = takeObject(text, at);
    if (raw) {
      try { out.push(JSON.parse(raw)); } catch { /* 跳过残片 */ }
      at = text.indexOf(marker, at + raw.length);
    } else {
      at = text.indexOf(marker, at + marker.length);
    }
  }
  return out;
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const pick = (app) => ({
  app_id: app?.id ?? null,
  // 身份键：优先官方 slug，没有就用 app_id —— 同一份 payload 里会出现两个都叫 omp 的 app
  slug: String(app?.slug || (app?.id ? `app-${app.id}` : '')).slice(0, 120),
  title: String(app?.title || '未命名').slice(0, 160),
  url: app?.main_url || app?.origin_url || (app?.slug ? `https://openrouter.ai/apps/${app.slug}` : ''),
});

const res = await fetch(PAGE, {
  headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
});
if (!res.ok) {
  console.error('[harnesses] 拉取失败：HTTP', res.status);
  process.exit(1);
}
const html = await res.text();
const text = decodePayload(html);
if (!text) {
  console.error('[harnesses] 页面里没有解析到 RSC 数据（站点可能改版了）');
  process.exit(1);
}

const popularRaw = scanRecords(text, '{"app_id":');
const trendingRaw = scanRecords(text, '{"appAnalytics":');
if (popularRaw.length === 0 && trendingRaw.length === 0) {
  console.error('[harnesses] 页面里没有任何 harness 记录（站点可能改版了）');
  process.exit(1);
}

// 增速按 app_id 挂：多数 app 没有 slug，用 slug 兜不住
const growthByApp = new Map();
for (const r of trendingRaw) {
  const id = r.appAnalytics?.app?.id ?? r.appAnalytics?.app_id;
  if (id && Number.isFinite(Number(r.growthPercent))) growthByApp.set(String(id), Number(r.growthPercent));
}

const all = new Map();
const push = (rec) => {
  const app = rec.app || {};
  const key = app.id ? `id:${app.id}` : String(app.slug || app.title || '');
  if (!key) return;
  const row = {
    ...pick(app),
    rank: num(rec.rank),
    tokens: num(rec.total_tokens),
    requests: num(rec.total_requests),
    growth: growthByApp.get(String(app.id ?? '')) ?? null,
  };
  const prev = all.get(key);
  // 同一个 app 会被 related_apps 重复收录，保留 token 数最大的那条
  if (!prev || prev.tokens < row.tokens) all.set(key, row);
};
popularRaw.forEach(push);
trendingRaw.forEach((r) => push(r.appAnalytics || {}));

const rows = [...all.values()].filter((r) => r.tokens > 0);
rows.sort((a, b) => b.tokens - a.tokens);
const popular = rows.map((r, i) => ({ ...r, rank: i + 1 }));

const trending = [...all.values()]
  .filter((r) => r.growth != null)
  .sort((a, b) => (b.growth || 0) - (a.growth || 0))
  .slice(0, 12)
  .map((r, i) => ({ ...r, rank: i + 1 }));

const payload = {
  generated_at: new Date().toISOString(),
  snapshot_date: stamp,
  source: 'openrouter/apps',
  counts: { popular: popular.length, trending: trending.length },
  popular,
  trending,
};

fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
console.log(
  `[harnesses] 写出 ${OUT}（popular ${payload.popular.length} / trending ${payload.trending.length}）`
);
