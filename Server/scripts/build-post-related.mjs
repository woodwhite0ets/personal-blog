#!/usr/bin/env node
/**
 * 生成「语义相关文章」（在工作站运行，利用本地 bge-m3）
 *
 * 流程：拉线上全部已发布文章 → 逐篇嵌入（标题+摘要+正文前 800 字）
 *      → 两两余弦 → 每篇取 top3 → 输出 JSON
 * 之后由 import-post-related.js 在服务器导库，前端 /related 接口优先用它。
 *
 * 用法：node Server/scripts/build-post-related.mjs --out /tmp/post-related.json
 */
import fs from 'node:fs';

const SITE = process.env.SITE || 'https://blog.woodwhite.top';
const EMBED = process.env.EMBED_URL || 'http://127.0.0.1:8090/v1/embeddings';
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : '/tmp/post-related.json';
const TOP_K = Number(process.env.TOP_K || 3);
const PAGES = Number(process.env.PAGES || 5);

async function embed(texts) {
  const res = await fetch(EMBED, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: texts, model: 'bge-m3' }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`embed ${res.status}`);
  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

function cos(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function fetchAll() {
  const posts = [];
  for (let page = 1; page <= PAGES; page++) {
    const res = await fetch(`${SITE}/api/posts?page=${page}&size=10&status=published`, {
      headers: { 'User-Agent': 'post-related-builder/1.0' },
    });
    if (!res.ok) break;
    const data = await res.json();
    const list = data.posts || [];
    posts.push(...list.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt || '' })));
    if (!data.totalPages || page >= data.totalPages) break;
  }
  return posts;
}

async function fetchContent(slug) {
  try {
    const res = await fetch(`${SITE}/api/posts/${encodeURIComponent(slug)}`, {
      headers: { 'User-Agent': 'post-related-builder/1.0' },
    });
    if (!res.ok) return '';
    const data = await res.json();
    const post = data.post || data;
    return String(post.content || '').slice(0, 800);
  } catch { return ''; }
}

const posts = await fetchAll();
console.log(`[related] 拉到 ${posts.length} 篇`);

for (const p of posts) {
  if (!p.excerpt) p.excerpt = await fetchContent(p.slug);
  await new Promise((r) => setTimeout(r, 120));   // 别把自家接口打满
}

const texts = posts.map((p) => `${p.title}\n${p.excerpt}`.slice(0, 1200));
console.log('[related] 嵌入中…');
const vecs = await embed(texts);

const result = [];
for (let i = 0; i < posts.length; i++) {
  const scored = [];
  for (let j = 0; j < posts.length; j++) {
    if (i === j) continue;
    scored.push({ slug: posts[j].slug, title: posts[j].title, score: cos(vecs[i], vecs[j]) });
  }
  scored.sort((a, b) => b.score - a.score);
  result.push({
    post_slug: posts[i].slug,
    post_title: posts[i].title,
    related: scored.slice(0, TOP_K).map((x, k) => ({ ...x, rank_no: k + 1, score: Number(x.score.toFixed(4)) })),
  });
}

fs.writeFileSync(OUT, JSON.stringify({ generated_at: new Date().toISOString(), source: 'bge-m3', total: posts.length, items: result }, null, 2));
console.log(`[related] 写出 ${OUT}（${posts.length} 篇，每篇 ${TOP_K} 条）`);
const sample = result[0];
if (sample) {
  console.log(`[related] 样例 ${sample.post_title.slice(0, 24)} →`);
  sample.related.forEach((r) => console.log(`   ${r.rank_no}. ${r.title.slice(0, 30)} (${r.score})`));
}
