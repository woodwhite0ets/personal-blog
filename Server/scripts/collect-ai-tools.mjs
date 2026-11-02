#!/usr/bin/env node
/**
 * AI 工具库候选采集（GitHub 搜索 API）
 *
 * 与 collect-ai-daily.mjs 的区别：
 *   榜单每天只要 12 条「今天新的」，工具库要的是「长期能按用途找」，
 *   所以这里按用途铺 topic、按查询配额取样，只产出候选；
 *   分类和中文由 tag-ai-tools.mjs 打标。
 *
 * 配额取样而不是全局按星截断：agent 这类大热 topic 会挤掉 tts / 图像 / 文档的名额，
 * 第一版按星数截 320 条时 agent 占了 52%，所以改成每个查询各取前 N 条。
 *
 * 用法：node Server/scripts/collect-ai-tools.mjs [--out /tmp/ai-tools-YYYY-MM-DD.json]
 *
 * 环境变量：
 *   GITHUB_TOKEN   可选，未认证限额 10 次/分钟
 */
import fs from 'node:fs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const stamp = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const OUT = outIdx >= 0 && args[outIdx + 1] ? args[outIdx + 1] : `/tmp/ai-tools-${stamp}.json`;

const GH_TOKEN = process.env.GITHUB_TOKEN || '';
const MIN_STARS = 200;
const PER_QUERY = 30;      // 每个查询最多取多少条（配额）
const QUOTA = 22;          // 每个查询实际入池的条数
const MAX_CANDIDATES = 480;
const UA = 'woodwhite-blog-ai-tools/1.0';

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

// 收录清单/教程：不当工具混进用途分类，但也不丢——单开 list 一类收录
const LIST_NAME = /awesome|cheatsheet|cheat-sheet|roadmap|tutorial|guide|handbook|-list\b|_list\b|collection/i;
const LIST_DESC = /curated list|hand-picked|a collection of|awesome list|roadmap|\btutorials?\b|book series|资源大全|教程合集|合集|全书|书稿/i;
const isListing = (name, desc) => LIST_NAME.test(String(name || '')) || LIST_DESC.test(String(desc || ''));

// 每个查询带一个「预期用途」，作为打标先验：同一仓库被多个 topic 命中时取第一个
const QUERIES = [
  { q: 'topic:ai-tools',            cat: 'other' },
  { q: 'topic:coding-assistant',    cat: 'code' },
  { q: 'topic:code-review',         cat: 'code' },
  { q: 'topic:writing-assistant',   cat: 'writing' },
  { q: 'topic:translation',         cat: 'writing' },
  { q: 'topic:text-to-image',       cat: 'image' },
  { q: 'topic:stable-diffusion',    cat: 'image' },
  { q: 'topic:text-to-video',       cat: 'video' },
  { q: 'topic:video-editing',       cat: 'video' },
  { q: 'topic:music-generation',    cat: 'audio' },
  { q: 'topic:text-to-speech',      cat: 'speech' },
  { q: 'topic:speech-to-text',      cat: 'speech' },
  { q: 'topic:chatbot',             cat: 'chat' },
  { q: 'topic:document-ai',         cat: 'docs' },
  { q: 'topic:knowledge-base',      cat: 'docs' },
  { q: 'topic:ai-agent',            cat: 'agent' },
  { q: 'topic:mcp',                 cat: 'agent' },
  { q: 'topic:workflow-automation',  cat: 'agent' },
  { q: 'topic:local-llm',           cat: 'model' },
  { q: 'topic:llm-inference',       cat: 'model' },
  { q: 'topic:fine-tuning',         cat: 'model' },
  { q: 'topic:rag',                 cat: 'data' },
  { q: 'topic:vector-database',     cat: 'data' },
  { q: 'topic:llmops',              cat: 'infra' },
  { q: 'topic:ui-design',           cat: 'design' },
  { q: 'topic:llm-evaluation',      cat: 'eval' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ghSearch(q) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${PER_QUERY}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': UA,
      ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
    },
  });
  if (res.status === 403 || res.status === 429) {
    const err = new Error(`rate limited (${res.status})`);
    err.rateLimited = true;
    throw err;
  }
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return res.json();
}

const map = new Map();
let listedAsList = 0;

for (const job of QUERIES) {
  const query = `${job.q} stars:>${MIN_STARS} pushed:>${daysAgo(240)}`;
  let attempt = 0;
  for (;;) {
    try {
      const body = await ghSearch(query);
      let added = 0;
      for (const r of body.items || []) {
        if (added >= QUOTA) break;
        if (!r || r.fork || r.archived) continue;
        if ((r.stargazers_count || 0) < MIN_STARS) continue;
        const isList = isListing(r.name, r.description);
        if (isList) listedAsList += 1;
        if (map.has(r.full_name)) continue;
        map.set(r.full_name, {
          repo: r.full_name,
          name: r.name,
          url: r.html_url,
          homepage: (r.homepage || '').trim() || null,
          desc_en: (r.description || '').trim().slice(0, 480),
          language: r.language || '',
          topics: (r.topics || []).slice(0, 8).join(','),
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          pushed_at: r.pushed_at || null,
          repo_created: r.created_at || null,
          license: r.license?.spdx_id || '',
          found_in: job.q.replace(/^topic:/, ''),
          found_cat: isList ? 'list' : job.cat,
        });
        added += 1;
      }
      console.log(`[gh] ${query.slice(0, 54)}… → 入池 ${added}（配额 ${QUOTA}）`);
      break;
    } catch (err) {
      if (err.rateLimited && attempt < 4) {
        const wait = 8000 * 2 ** attempt;
        console.log(`[gh] ${err.message}，${wait / 1000}s 后重试：${query.slice(0, 44)}`);
        await sleep(wait);
        attempt += 1;
        continue;
      }
      console.warn(`[gh] 跳过查询（${err.message}）：${query.slice(0, 44)}`);
      break;
    }
  }
  await sleep(GH_TOKEN ? 1500 : 6500);
}

// 入池后仍按星数排，但每类已有配额保证，不会被单一用途吃掉
const candidates = [...map.values()]
  .sort((a, b) => b.stars - a.stars)
  .slice(0, MAX_CANDIDATES);

const byCat = {};
for (const c of candidates) byCat[c.found_cat] = (byCat[c.found_cat] || 0) + 1;

const payload = {
  generated_at: new Date().toISOString(),
  snapshot_date: stamp,
  source: 'github-topic',
  min_stars: MIN_STARS,
  count: candidates.length,
  listed_as_list: listedAsList,
  by_query_category: byCat,
  candidates,
};
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
console.log(`[tools] 写出 ${OUT}（${candidates.length} 个候选，其中清单类 ${listedAsList}）`);
console.log(`[tools] 查询配额分布：${Object.entries(byCat).map(([k, v]) => `${k}:${v}`).join(' ')}`);
