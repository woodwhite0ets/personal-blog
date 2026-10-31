#!/usr/bin/env node
/**
 * 博客「AI 味」检查器：给一篇 markdown 打分，指出像 AI 写的具体位置。
 *
 * 用法：
 *   node scripts/slop-check.mjs <file.md>
 *   node scripts/slop-check.mjs <file.md> --json
 *
 * 打分口径：0 = 很像人写的，100 = 满篇 AI 腔。低于 25 算过关。
 * 规则来自对本人既有文章（第一人称、现场细节、短断言、ASCII 图、命令逐行解释）的反向对照。
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const JSON_OUT = process.argv.includes('--json');
if (!file) { console.error('用法: node slop-check.mjs <file.md> [--json]'); process.exit(2); }
const raw = readFileSync(file, 'utf8');

// ── 词表：口号词 / 空转词 / AI 高频连接词 ──
const SLOP_WORDS = [
  '赋能', '闭环', '抓手', '生态', '体系化', '全链路', '全栈化', '深度融合', '降本增效',
  '显著提升', '极大提升', '有效提升', '大幅提升', '全面提升', '助力', '一站式', '开箱即用',
  '无缝', '业界领先', '最佳实践', '核心价值', '顶层设计', '打法', '心智', '抓手',
  '在当今', '随着', '众所周知', '毋庸置疑', '不可否认', '值得一提的是', '需要注意的是',
  '值得注意的是', '总而言之', '综上所述', '总的来说', '让我们', '我们相信', '我们深知',
  '不仅', '而且', '同时', '从而', '进而', '有效地', '极大地', '进一步',
];
const AI_OPENERS = [/^首先[，,]/, /^其次[，,]/, /^最后[，,]/, /^另外[，,]/, /^此外[，,]/];
const NOMINALIZATION = /[\u4e00-\u9fa5]{2}(性|化)(?![学])/g;   // xx性 / xx化
// 排除清单勾选符号（✅❌⚠️✔✗）与箭头，这些在技术文档里是语义标记，不是 AI 味
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;
const ALLOWED_MARKS = new Set(['✅', '❌', '⚠', '✔', '✗', '→', '←', '↑', '↓', '—', '–']);

// ── 结构切分 ──
const lines = raw.split('\n');
const bodyLines = [];
let inCode = false;
for (const line of lines) {
  if (/^```/.test(line.trim())) { inCode = !inCode; continue; }
  if (!inCode) bodyLines.push(line);
}
const body = bodyLines.join('\n');
const headings = bodyLines.map((l, i) => ({ i, m: l.match(/^(#{1,4})\s+(.+)$/) })).filter((x) => x.m);
const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#') && !p.startsWith('>') && !p.startsWith('|') && !/^[-*]\s/.test(p));

// ── 句长与段落 ──
// 只在「正常段落」里取句子：列表项、表格、引用块不参与句长与排比统计
const proseLines = bodyLines.filter((l) => {
  const t = l.trim();
  return t && !/^[-*|>]/.test(t) && !/^\d+\./.test(t) && !/^#{1,4}\s/.test(t);
});
const sentences = (proseLines.join('\n').match(/[^。！？\n]{4,}[。！？]?/g) || []).map((s) => s.trim()).filter((s) => s.length > 3);
const lens = sentences.map((s) => s.replace(/\s/g, '').length);
const avg = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length);
const sd = Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / Math.max(1, lens.length));
const paraLens = paragraphs.map((p) => p.length);
const paraAvg = paraLens.reduce((a, b) => a + b, 0) / Math.max(1, paraLens.length);
const paraSd = Math.sqrt(paraLens.reduce((a, b) => a + (b - paraAvg) ** 2, 0) / Math.max(1, paraLens.length));

// ── 命中收集 ──
const hits = [];
const push = (kind, line, hit, advice) => hits.push({ kind, line, hit, advice });

lines.forEach((line, idx) => {
  const n = idx + 1;
  for (const w of SLOP_WORDS) if (line.includes(w)) push('口号/空转词', n, w, '删掉或换成具体动作与数字');
  for (const re of AI_OPENERS) if (re.test(line.trim())) push('模板连接词', n, line.trim().slice(0, 12), '删掉序号连接词，让段落自己承接');
  const em = line.match(EMOJI);
  if (em && em.some((e) => !ALLOWED_MARKS.has(e))) push('emoji', n, em.filter((e) => !ALLOWED_MARKS.has(e))[0], '技术博客不用装饰性 emoji');
  const bold = (line.match(/\*\*/g) || []).length / 2;
  if (bold >= 4) push('加粗过密', n, `${bold} 处`, '一段最多加粗 1–2 个关键词');
  if (/[—–]{1}/.test(line) && (line.match(/[—–]/g) || []).length >= 3) push('破折号过多', n, '', '一句话里最多一个破折号');
  const nom = line.match(NOMINALIZATION) || [];
  if (nom.length >= 3) push('名词化堆叠', n, nom.join(' '), '改用动词：把"优化"写清"怎么改的"');
  if (/我们|大家|各位/.test(line)) push('人称漂移', n, line.match(/我们|大家|各位/)[0], '你的博客用「我」');
});

// 末节总结检测
const last = headings[headings.length - 1];
if (last && /总结|结语|写在最后|后记|结论/.test(last.m[2])) {
  push('总结段', last.i + 1, last.m[2], '用最后一条事实收尾，不写总结段');
}
// 三连排比：连续三句以相同 2 字开头
for (let i = 0; i + 2 < sentences.length; i++) {
  const head = (s) => s.replace(/\s/g, '').slice(0, 2);
  if (head(sentences[i]) === head(sentences[i + 1]) && head(sentences[i + 1]) === head(sentences[i + 2])) {
    push('排比三连', 0, sentences[i].slice(0, 14), '排比超过两项就砍');
  }
}
// 句长过于均匀
if (lens.length >= 12 && sd < 8) push('句长过于均匀', 0, `标准差 ${sd.toFixed(1)}`, '长短句交替，真人写作起伏大');
// 段落过于均匀
if (paraLens.length >= 6 && paraSd < 25) push('段落过于均匀', 0, `标准差 ${paraSd.toFixed(0)}`, '有的段落就该只有一句话');

// ── 打分 ──
const weights = {
  '口号/空转词': 6, '模板连接词': 5, '总结段': 8, '加粗过密': 3, emoji: 3,
  '破折号过多': 2, '名词化堆叠': 3, '人称漂移': 3, '排比三连': 5, '句长过于均匀': 8, '段落过于均匀': 6,
};
const score = Math.min(100, hits.reduce((s, h) => s + (weights[h.kind] || 2), 0));

const result = {
  file,
  score,
  verdict: score < 25 ? '过关（像人写的）' : score < 50 ? '有点 AI 味，建议改' : 'AI 味明显，重写',
  stats: {
    chars: body.length,
    headings: headings.length,
    sentences: sentences.length,
    avgSentence: Number(avg.toFixed(1)),
    sentenceSd: Number(sd.toFixed(1)),
    paragraphs: paragraphs.length,
    avgParagraph: Number(paraAvg.toFixed(0)),
  },
  hits,
};

if (JSON_OUT) {
  console.log(JSON.stringify(result, null, 1));
} else {
  console.log(`\n${file}`);
  console.log(`AI 味打分：${score}/100 — ${result.verdict}`);
  console.log(`正文 ${result.stats.chars} 字 · ${result.stats.headings} 个小节 · ${result.stats.sentences} 句（均长 ${result.stats.avgSentence}，标准差 ${result.stats.sentenceSd}） · ${result.stats.paragraphs} 段（均长 ${result.stats.avgParagraph}）\n`);
  if (!hits.length) {
    console.log('没有命中，保持这样。');
  } else {
    const byKind = {};
    for (const h of hits) (byKind[h.kind] ||= []).push(h);
    for (const [kind, list] of Object.entries(byKind)) {
      console.log(`● ${kind}（${list.length} 处）`);
      for (const h of list.slice(0, 6)) {
        console.log(`    ${h.line ? `第 ${h.line} 行` : '全文'}：${h.hit || ''}  → ${h.advice}`);
      }
      if (list.length > 6) console.log(`    …还有 ${list.length - 6} 处`);
      console.log();
    }
  }
}
