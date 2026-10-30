#!/usr/bin/env node
/**
 * AI 项目榜采集脚本（在工作站运行，不入服务器）
 *
 * 流程：GitHub Search API 抓候选仓库 → 合并去重 → 本地 llama.cpp 生成中文一句话
 *      → 输出 JSON（由 import-ai-daily.js 导入线上库并计算日增、排榜）
 *
 * 用法：
 *   node Server/scripts/collect-ai-daily.mjs                 # 输出到 /tmp/ai-daily-<date>.json
 *   node Server/scripts/collect-ai-daily.mjs --out /path.json
 *   node Server/scripts/collect-ai-daily.mjs --no-llm         # 跳过中文生成（调试用）
 *
 * 环境变量：
 *   GITHUB_TOKEN   可选，提升 API 限额（未认证 10 次/分钟）
 *   LLM_ENDPOINT   默认 http://127.0.0.1:8092/v1/chat/completions
 *   LLM_MODEL      默认 qwen2.5-coder-7b
 */
import fs from 'node:fs';
import path from 'node:path';

const GH_TOKEN = process.env.GITHUB_TOKEN || '';
const LLM_ENDPOINT = process.env.LLM_ENDPOINT || 'http://127.0.0.1:8092/v1/chat/completions';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen2.5-coder-7b';
const UA = 'woodwhite-blog-ai-daily/1.0';

const args = process.argv.slice(2);
const outArgIdx = args.indexOf('--out');
const noLlm = args.includes('--no-llm');
const stamp = new Date().toISOString().slice(0, 10);
const OUT = outArgIdx >= 0 && args[outArgIdx + 1]
  ? args[outArgIdx + 1]
  : `/tmp/ai-daily-${stamp}.json`;

const MIN_STARS = 300;
const PER_QUERY = 30;
const MAX_CANDIDATES = 120;

// 近 N 天日期（GitHub 查询语法）
function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

const QUERIES = [
  `topic:llm stars:>${MIN_STARS} pushed:>${daysAgo(60)}`,
  `topic:ai-agents stars:>${MIN_STARS} pushed:>${daysAgo(60)}`,
  `topic:rag stars:>${MIN_STARS} pushed:>${daysAgo(90)}`,
  `topic:generative-ai stars:>${MIN_STARS * 2} pushed:>${daysAgo(60)}`,
  `topic:llm created:>${daysAgo(120)} stars:>${MIN_STARS}`,
  `topic:agent created:>${daysAgo(120)} stars:>${MIN_STARS}`,
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ghSearch(q, attempt = 0) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${PER_QUERY}`;
  const headers = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };
  if (GH_TOKEN) headers.Authorization = `Bearer ${GH_TOKEN}`;
  const res = await fetch(url, { headers });
  if (res.status === 403 || res.status === 429) {
    if (attempt < 2) {
      const wait = 8000 * (attempt + 1);
      console.warn(`[gh] rate limited (${res.status})，${wait / 1000}s 后重试：${q}`);
      await sleep(wait);
      return ghSearch(q, attempt + 1);
    }
    throw new Error(`GitHub API 限流，查询失败：${q}`);
  }
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${q}`);
  const json = await res.json();
  return json.items || [];
}

// 本地模型生成中文一句话（术语与格式在 prompt 里锁定）
const SYSTEM_PROMPT = `你是技术编辑，为「每日 AI 项目榜」写中文介绍。

规则：
- 一句话，不超过 30 个汉字
- 说清「它是什么 + 能做什么」，客观陈述，不评价、不渲染
- 术语统一：agent=智能体，harness=框架，skill=技能，inference=推理，serving=部署
- 不写项目名开头，不用引号，不用"它是一个……"的句式
- 只输出这句话

示例：
英文：A fast inference engine for large language models with OpenAI-compatible API.
中文：为大模型提供兼容 OpenAI 接口的高速推理引擎。
英文：Browser automation framework that lets vision models click through web apps.
中文：浏览器自动化框架，让视觉模型像人一样操作网页应用。`;

async function zhSummary(repo, desc) {
  const body = {
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `项目：${repo}\n英文：${desc}` },
    ],
    temperature: 0.2,
    max_tokens: 150,
    stream: false,
  };
  const res = await fetch(LLM_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const json = await res.json();
  let text = (json.choices?.[0]?.message?.content || '').trim().replace(/\s+/g, ' ');
  text = text.replace(/^["“”'「」]|["“”'「」]$/g, '');
  return text.slice(0, 80);
}

// 模型输出不稳定（超长、多句、括号枚举），用确定性规则收敛成一句话
// 中文之间去空格，中英文之间保留单空格，避免 "ClaudeCode" 这种粘连
function tightenZh(raw, max = 36) {
  let t = (raw || '').replace(/[\u201c\u201d\u2018\u2019"']/g, '').trim();
  if (!t) return '';
  const len = (str) => [...str].length;
  t = t.replace(/\s+/g, ' ')
       .replace(/(?<=[\u4e00-\u9fa5\uff0c\u3002\uff1b\uff1a])\s+(?=[\u4e00-\u9fa5\uff0c\u3002\uff1b\uff1a])/g, '');
  // 去掉括号补充/枚举（括号未闭合也一并清掉）
  const stripped = t
    .replace(/\uff08[^\uff08\uff09]*\uff09?/g, '')
    .replace(/\([^()]*\)?/g, '')
    .replace(/[\uff0c\u3001\uff1b\uff1a,;:]{2,}/g, '\uff0c')
    .replace(/^[\uff0c\u3002\uff1b\uff1a\s]+|[\uff0c\u3001\uff1b\uff1a\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (len(stripped) >= 8) t = stripped;
  // 只保留第一句
  const m = t.match(/^(.+?[\u3002\uff01\uff1f])/);
  if (m) t = m[1].replace(/[\u3002\uff01\uff1f]$/, '');
  if (len(t) <= max) return t;
  // 按逗号累加，避免硬切断句
  const parts = t.split(/(?<=[\uff0c\u3001\uff1b])/);
  let out = '';
  for (const p of parts) {
    if (len(out + p) > max) break;
    out += p;
  }
  out = out.replace(/[\uff0c\u3001\uff1b\uff1a]$/, '').trim();
  if (len(out) < 10) out = [...t].slice(0, max).join('');
  return out;
}

async function withConcurrency(items, limit, worker) {
  const out = new Array(items.length);
  let idx = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return out;
}

async function main() {
  console.log(`[collect] 目标日期 ${stamp}，${QUERIES.length} 个查询`);
  const map = new Map();

  for (const q of QUERIES) {
    try {
      const items = await ghSearch(q);
      let added = 0;
      for (const r of items) {
        if (!r || r.fork || r.archived) continue;
        if ((r.stargazers_count || 0) < MIN_STARS) continue;
        if (r.owner?.login === 'renovate') continue;
        if (map.has(r.full_name)) continue;
        map.set(r.full_name, {
          repo: r.full_name,
          name: r.name,
          url: r.html_url,
          desc_en: (r.description || '').trim().slice(0, 480),
          language: r.language || '',
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          repo_created: r.created_at || null,
          topics: (r.topics || []).slice(0, 6).join(','),
          pushed_at: r.pushed_at || null,
        });
        added += 1;
      }
      console.log(`[gh] ${q.slice(0, 48)}… → ${items.length} 条，新增 ${added}`);
    } catch (err) {
      console.warn(`[gh] 跳过查询（${err.message}）：${q}`);
    }
    await sleep(GH_TOKEN ? 1500 : 6500);
  }

  let repos = [...map.values()].sort((a, b) => b.stars - a.stars).slice(0, MAX_CANDIDATES);
  console.log(`[collect] 候选 ${repos.length} 个`);

  if (!noLlm) {
    const need = repos.filter((r) => r.desc_en);
    console.log(`[llm] 生成中文介绍 ${need.length} 条（并发 4）…`);
    const t0 = Date.now();
    let done = 0;
    await withConcurrency(need, 4, async (r) => {
      try {
        r.desc_zh = await zhSummary(r.repo, r.desc_en);
      } catch (err) {
        r.desc_zh = '';
        console.warn(`[llm] ${r.repo} 失败：${err.message}`);
      }
      done += 1;
      if (done % 20 === 0) console.log(`[llm] ${done}/${need.length}`);
    });
    need.forEach((r) => { r.desc_zh = tightenZh(r.desc_zh); });
    console.log(`[llm] 完成，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } else {
    repos.forEach((r) => { r.desc_zh = ''; });
  }

  const payload = {
    generated_at: new Date().toISOString(),
    snapshot_date: stamp,
    source: 'github-search',
    min_stars: MIN_STARS,
    repos,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');

  const withZh = repos.filter((r) => r.desc_zh).length;
  console.log(`[collect] 写出 ${OUT}（${repos.length} 个仓库，中文 ${withZh} 条）`);
}

main().catch((err) => {
  console.error('[collect] 失败：', err.message);
  process.exit(1);
});
