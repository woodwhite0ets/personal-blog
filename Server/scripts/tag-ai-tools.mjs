#!/usr/bin/env node
/**
 * AI 工具库打标（工作站运行，本地模型 8092）
 *
 * 输入 collect-ai-tools.mjs 产出的候选 JSON，为每个候选生成：
 *   一句话中文 tagline、用途分类 category、标签 tags、形态 form、定价 pricing、是否需要 key、是否有中文界面
 * 输出：同一份 JSON 就地补上 `tool` 字段，供 import-ai-tools.js 写库。
 *
 * 用法：
 *   node Server/scripts/tag-ai-tools.mjs /tmp/ai-tools-2026-11-02.json [--known /tmp/known.txt] [--limit N]
 *
 * 环境变量：
 *   LLM_ENDPOINT  默认 http://127.0.0.1:8092/v1/chat/completions
 *   LLM_MODEL     默认 qwen3-4b（8092 上实际加载的模型）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATEGORIES = JSON.parse(
  fs.readFileSync(path.join(HERE, '..', 'src', 'config', 'ai-tool-categories.json'), 'utf8')
);
const CAT_KEYS = CATEGORIES.map((c) => c.key);
const CAT_HINT = CATEGORIES.map((c) => `- ${c.key}：${c.label}（${c.hint}）`).join('\n');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const knownIdx = args.indexOf('--known');
const limitIdx = args.indexOf('--limit');
if (!file) {
  console.error('用法: node Server/scripts/tag-ai-tools.mjs <payload.json> [--known known.txt] [--limit N]');
  process.exit(1);
}

const ENDPOINT = process.env.LLM_ENDPOINT || 'http://127.0.0.1:8092/v1/chat/completions';
const MODEL = process.env.LLM_MODEL || 'qwen3-4b';

const known = new Set();
if (knownIdx >= 0 && args[knownIdx + 1]) {
  for (const line of fs.readFileSync(args[knownIdx + 1], 'utf8').split('\n')) {
    const v = line.trim();
    if (v) known.add(v);
  }
}
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 0 : 0;
const CAT_LABEL = new Map(CATEGORIES.map((c) => [c.key, c.label]));
// 采集侧的用途先验比模型猜的准（agent 是 4B 模型的默认倾向）
const AGENTISH = /agent|mcp|workflow|automat|orchestr|multi-agent/i;

const SYSTEM_PROMPT = `你是 AI 工具目录的编辑。给定一个开源项目的名称、说明和 GitHub topics，请判断它属于哪类工具并写一句中文简介。

可用分类（只能选一个 key）：
${CAT_HINT}

判断顺序（重要）：
1. 先问「用户用它做完事得到什么」：一张图→image，一段语音→speech，一个能跑的本地模型→model，一次代码修改→code。
2. agent 只留给「让模型自主多步执行、或编排/调度其它工具」的东西（agent 框架、工作流引擎、MCP 服务、浏览器自动化）。
   一个 TTS 项目、一个向量库、一个翻译工具，即使内部用了 LLM，也不是 agent。不确定时选更具体的用途，不要默认 agent。
3. 训练/微调/量化/推理引擎→model；把它部署成服务、算力调度、成本与监控→infra；向量库/embedding/检索→data。
3.5 awesome 清单、资源汇总、教程/课程目录本身不是工具，是别人的收录 → list。
4. tags 不要复用简介里已经出现的词，也不要写「AI」「工具」「开源」这类没有信息量的词。

输出要求：只输出一个 JSON 对象，不要有任何解释、不要代码块标记。字段如下：
{
  "category": "上面某个 key",
  "tagline_zh": "一句话中文，不超过 30 个汉字，说清它是什么+能干什么，客观陈述，不评价、不渲染",
  "tags": ["3 到 5 个短标签，每个不超过 12 个字，用中文，覆盖用途/技术/场景"],
  "form": "web | desktop | cli | library | model | plugin 之一",
  "pricing": "free | freemium | paid | api 之一（开源可自托管记 free；有付费托管版记 freemium）",
  "needs_key": true 或 false（使用它是否必须自备第三方 API key，如 OpenAI/Anthropic key）,
  "zh_ui": true 或 false（是否提供中文界面）
}

示例：
- 「终端里的编程智能体，可自己读写代码并执行命令」→ code / cli（做的是改代码，不是编排）
- 「多智能体编排框架，把多个模型串成工作流」→ agent / library
- 「支持中文的语音合成模型，可克隆音色」→ speech / model
- 「面向 RAG 的向量数据库，支持混合检索」→ data / library
- 「把 PDF 转成结构化 Markdown 的解析器」→ docs / library
- 「收录 200 个 AI 工具的项目清单」→ other`;

const FORMS = ['web', 'desktop', 'cli', 'library', 'model', 'plugin'];

// 收录清单/教程，不是工具：单独归 list，不再混进用途分类
const LIST_NAME = /awesome|cheatsheet|cheat-sheet|roadmap|tutorial|guide|handbook|-list\b|_list\b|collection/i;
const LIST_DESC = /curated list|hand-picked|a collection of|awesome list|roadmap|\btutorials?\b|book series|资源大全|教程合集|合集|全书|书稿/i;
const isListing = (name, desc) => LIST_NAME.test(String(name || '')) || LIST_DESC.test(String(desc || ''));

// 没有信息量的标签
const GENERIC_TAGS = new Set(['AI', 'ai', '人工智能', 'AI工具', '工具', '开源', '开源项目', '大模型', 'LLM', 'llm']);
const PRICINGS = ['free', 'freemium', 'paid', 'api'];

// 打标失败时的兜底：按 topics 里的关键词猜用途，避免整条被丢掉
const TOPIC_FALLBACK = [
  [/vector|embedding|retrieval|^rag$|,rag|rag,|rag$/i, 'data'],
  [/tts|speech|voice|whisper|audio|music/i, 'speech'],
  [/image|diffusion|text-to-image|stable-diffusion/i, 'image'],
  [/video/i, 'video'],
  [/local-llm|inference|llama|quantiz|ollama|fine-?tun/i, 'model'],
  [/document|pdf|note|knowledge/i, 'docs'],
  [/writing|translation|translate|office/i, 'writing'],
  [/eval|benchmark/i, 'eval'],
  [/ui|design|frontend/i, 'design'],
  [/code|coding|review|ide|devtool|linter/i, 'code'],
  [/mcp|agent|workflow|automation|orchestr/i, 'agent'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pickCategory(topicText, raw) {
  if (raw && CAT_KEYS.includes(raw)) return raw;
  for (const [re, key] of TOPIC_FALLBACK) {
    if (re.test(topicText)) return key;
  }
  return 'other';
}

// 模型对 agent 有强烈默认倾向：它说 agent、但采集先验是别的用途、topics 也不像 agent 时，听先验的
function resolveCategory(c, raw) {
  if (isListing(c.name, c.desc_en)) return 'list';
  const guessed = pickCategory(c.topics || '', raw);
  if (
    guessed === 'agent'
    && c.found_cat
    && c.found_cat !== 'agent'
    && !AGENTISH.test(c.topics || '')
  ) {
    return c.found_cat;
  }
  return guessed;
}

// 标签去噪：不重复简介/分类里的词，不留空标签
function cleanTags(rawTags, tagline, categoryLabel) {
  const seen = new Set();
  const out = [];
  for (const raw of rawTags) {
    const t = clampText(raw, 12).replace(/^#/, '').trim();
    if (!t || GENERIC_TAGS.has(t) || t === categoryLabel) continue;
    if (tagline && tagline.includes(t)) continue;   // 和简介撞词
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 3) break;
  }
  return out;
}

// 简介开头别重复项目名（模型偶尔会）
function cleanTagline(text, name) {
  let t = clampText(text, 60).replace(/^[\s:：,，-]+/, '');
  const n = String(name || '').trim();
  if (n) {
    const lower = t.toLowerCase();
    for (const cand of [n, n.replace(/[-_.]/g, ' ')]) {
      if (cand && lower.startsWith(cand.toLowerCase())) {
        t = t.slice(cand.length).replace(/^[\s:：,，是的]+/, '');
      }
    }
  }
  return t;
}

function clampText(s, max) {
  const t = String(s || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  return [...t].slice(0, max).join('');
}

function parseJsonLoose(text) {
  const i = text.indexOf('{');
  const j = text.lastIndexOf('}');
  if (i < 0 || j <= i) throw new Error('no json object');
  return JSON.parse(text.slice(i, j + 1));
}

async function callLlm(userContent, maxTokens = 260) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
      stream: false,
      // 8092 是 Qwen3 思考模型：不关思考时答案落在 reasoning_content，content 会是空串
      chat_template_kwargs: { enable_thinking: false },
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const json = await res.json();
  const text = (json.choices?.[0]?.message?.content || '').trim();
  if (!text) throw new Error('empty content');
  return text;
}

async function tagOne(c) {
  const user = [
    `项目：${c.repo}`,
    c.desc_en ? `英文说明：${c.desc_en}` : '英文说明：（无）',
    c.language ? `主语言：${c.language}` : '',
    c.topics ? `topics：${c.topics}` : '',
    c.homepage ? `官网：${c.homepage}` : '',
    c.found_cat ? `检索来源：topic:${c.found_in}（这一类大多是「${CAT_LABEL.get(c.found_cat) || '其他'}」）` : '',
    `星数：${c.stars}`,
  ].filter(Boolean).join('\n');

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await callLlm(user);
      const obj = parseJsonLoose(raw);
      const category = resolveCategory(c, obj.category);
      const tagline = cleanTagline(obj.tagline_zh, c.name);
      const tags = cleanTags(Array.isArray(obj.tags) ? obj.tags : [], tagline, CAT_LABEL.get(category) || '');
      return {
        category,
        tagline_zh: tagline,
        tags: tags.join(','),
        form: FORMS.includes(obj.form) ? obj.form : (c.homepage ? 'web' : 'library'),
        pricing: PRICINGS.includes(obj.pricing) ? obj.pricing : 'free',
        needs_key: obj.needs_key ? 1 : 0,
        zh_ui: obj.zh_ui ? 1 : 0,
        tag_failed: 0,
      };
    } catch (err) {
      lastErr = err;
      await sleep(300);
    }
  }
  // 兜底：分类靠 topics 猜，tagline 留空让前端回退到英文说明
  return {
    category: pickCategory(`${c.topics || ''} ${c.desc_en || ''}`, null),
    tagline_zh: '',
    tags: '',
    form: c.homepage ? 'web' : 'library',
    pricing: 'free',
    needs_key: 0,
    zh_ui: 0,
    tag_failed: 1,
    tag_error: lastErr ? lastErr.message : 'unknown',
  };
}

async function withConcurrency(list, n, fn) {
  let idx = 0;
  const workers = Array.from({ length: n }, async () => {
    for (;;) {
      const i = idx++;
      if (i >= list.length) return;
      await fn(list[i], i);
    }
  });
  await Promise.all(workers);
}

const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
const all = payload.candidates || [];
const todo = all.filter((c) => !known.has(c.repo));
const work = limit > 0 ? todo.slice(0, limit) : todo;

console.log(`[tag] 候选 ${all.length}，已知 ${all.length - todo.length}，本次打标 ${work.length}（并发 4）`);
const t0 = Date.now();
let done = 0;
let failed = 0;

await withConcurrency(work, 4, async (c) => {
  const result = await tagOne(c);
  c.tool = result;
  if (result.tag_failed) failed += 1;
  done += 1;
  if (done % 20 === 0) console.log(`[tag] ${done}/${work.length}`);
});

// 已知工具没有 tool 字段，importer 会跳过它们的元数据更新
payload.tagged_at = new Date().toISOString();
payload.tagged_count = work.length;
payload.tag_failed = failed;
fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
const byCat = {};
for (const c of all) {
  if (c.tool) byCat[c.tool.category] = (byCat[c.tool.category] || 0) + 1;
}
console.log(
  `[tag] 分类分布：${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' ')}`
);
console.log(
  `[tag] 完成，用时 ${((Date.now() - t0) / 1000).toFixed(1)}s，打标 ${work.length} 条，失败兜底 ${failed} 条 → ${file}`
);
