#!/usr/bin/env node
/**
 * 把知识库整理成博客可公开的「笔记索引」（在工作站运行）
 *
 * 只输出索引信息（标题/项目/标签/更新日期/一句话摘要），不输出正文。
 * 摘要与标题做脱敏：内网 IP、绝对路径、SSH 端口等换成占位符，避免把环境细节挂到公网。
 *
 * 用法：node Server/scripts/build-notes.mjs --out /tmp/notes.json
 *      node Server/scripts/build-notes.mjs --all     # 含 stale/superseded（默认只要 active）
 */
import fs from 'node:fs';
import path from 'node:path';

const KB = process.env.KB_ROOT || '/data/knowledge';
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : '/tmp/notes.json';
const INCLUDE_HISTORY = args.includes('--all');

// ── 脱敏：公网页面不该出现这些 ──
const REDACTIONS = [
  [/\b(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}\b/g, (m) => (m.startsWith('192.168.') || m.startsWith('10.') || m.startsWith('172.') ? '<内网地址>' : '<地址>')],
  [/\/home\/[\w.-]+/g, '~'],
  [/\b(?:sk|pk|ghp|gho|xoxb)-[A-Za-z0-9_-]{12,}\b/g, '<凭据>'],
  [/\b[A-Za-z0-9_-]{24,}\b/g, (m) => (/^[0-9a-f]{24,}$/i.test(m) ? m.slice(0, 6) + '…' : m)],
];

function redact(text) {
  let out = String(text || '');
  for (const [re, repl] of REDACTIONS) out = out.replace(re, repl);
  return out;
}

function parseFM(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (!m) return { meta, body: txt };
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, body: txt.slice(m[0].length) };
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith('.') || name === '_inbox' || name === '_tools' || name === 'node_modules') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (name.endsWith('.md') && name !== '_reports.md' && name !== 'README.md') out.push(full);
  }
  return out;
}

// 摘要：优先用条目自带的「一句话摘要」，其次找像话的段落
function firstParagraph(body) {
  const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1) 条目自带的摘要行：> 一句话摘要：xxx / > 一句话：xxx
  for (const line of lines.slice(0, 12)) {
    const m = line.match(/^>\s*(?:一句话摘要|一句话|摘要)[：:]\s*(.+)$/);
    if (m) {
      const t = m[1].replace(/[*`\[\]]/g, '').trim();
      if (t.length >= 8) return t.slice(0, 180);
    }
  }
  // 2) 普通段落：跳过标题/图示/表格/配置行
  for (const line of lines) {
    if (/^[#>|\-*+`]/.test(line)) continue;
    if (/[│─┌└├┐┘┬┴┼▶◀→←↑↓]/.test(line)) continue;
    if ((line.match(/[:：/\\]/g) || []).length > 4) continue;
    const plain = line.replace(/[*`\[\]]/g, '').trim();
    if (plain.length < 16) continue;
    if (/^[\d\s年月日:：.-]+$/.test(plain)) continue;
    return plain.slice(0, 180);
  }
  return '';
}

const notes = [];
for (const full of walk(KB)) {
  const rel = path.relative(KB, full);
  const { meta, body } = parseFM(fs.readFileSync(full, 'utf8'));
  const status = String(meta.status || 'active');
  if (!INCLUDE_HISTORY && status !== 'active') continue;
  if (String(meta.public || '').toLowerCase() === 'false') continue;

  const title = redact(meta.title || rel.replace(/\.md$/, ''));
  const summary = redact(firstParagraph(body)).slice(0, 180);
  const project = rel.includes('/') ? rel.split('/')[0] : '_shared';
  // 全文开放：正文同样过一遍脱敏；frontmatter 里 public: false 的会跳过
  const publicBody = redact(body);
  const RISK = /(\.env|密码|password|passwd|私钥|secret|api[_-]?key|admin-key|token|越权|漏洞)/i;
  const riskHits = (publicBody.match(new RegExp(RISK.source, 'gi')) || []).length;
  notes.push({
    path: rel,
    title,
    project: project === '_shared' ? '通用' : project,
    tags: String(meta.tags || '').replace(/[\[\]]/g, '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4),
    status,
    updated: meta.updated || '',
    summary,
    body: publicBody,
    chars: body.length,
    riskHits,
  });
}

notes.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));

fs.writeFileSync(OUT, JSON.stringify({
  generated_at: new Date().toISOString(),
  total: notes.length,
  projects: [...new Set(notes.map((n) => n.project))],
  notes,
}, null, 2));

console.log(`[notes] ${notes.length} 条 → ${OUT}`);
const byProject = {};
for (const n of notes) byProject[n.project] = (byProject[n.project] || 0) + 1;
console.log('[notes] 分布:', Object.entries(byProject).map(([k, v]) => `${k}(${v})`).join(' '));
const risky = notes.filter((n) => n.riskHits > 0).sort((a, b) => b.riskHits - a.riskHits);
if (risky.length) {
  console.log(`[notes] 含敏感关键词的条目 ${risky.length} 条（已脱敏，仍建议复核）：`);
  risky.slice(0, 8).forEach((n) => console.log(`   ${n.riskHits} 处  ${n.title.slice(0, 40)}`));
}
if (notes[0]) console.log('[notes] 样例:', notes[0].title, '|', notes[0].summary.slice(0, 60));
