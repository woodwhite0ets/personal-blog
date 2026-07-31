// 一次性脚本：把组件中的硬编码颜色替换为 CSS 变量
// 用于主题系统改造。基于精确映射表，只替换样式声明值中的颜色。
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', 'src', 'components');
const FILES = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (f.endsWith('.vue')) FILES.push(full);
  }
}
walk(ROOT);

// ===== 精确映射表 =====
// key: 原始颜色，value: CSS 变量
// 语义化分类。每个颜色按其在样式中的语义替换。
const HEX_MAP = {
  // 背景层
  '#0a0a0c': 'var(--bg)',           // 页面背景
  '#0f1013': 'var(--bg-elevated)',   // 卡片/输入框
  '#16171b': 'var(--bg-float)',      // 下拉/浮层
  '#0c0c0d': 'var(--bg-deeper)',     // 登录卡片/代码背景
  '#0c0c0e': 'var(--bg-code)',       // 代码块背景
  '#141419': 'var(--divider)',       // 分割线
  // 文字
  '#c9d1d9': 'var(--text)',
  '#e6edf3': 'var(--text-bright)',
  '#6e737a': 'var(--text-dim)',
  '#484b52': 'var(--text-muted)',
  '#33363c': 'var(--text-faint)',
  '#8b9098': 'var(--text-secondary)',
  '#5a5d64': 'var(--text-hint)',
  // 边框
  '#1c1d21': 'var(--border)',
  '#25262a': 'var(--border-strong)',
  // accent 系
  '#00d4ff': 'var(--accent)',
  '#00b8d4': 'var(--accent-hover)',
  // 状态色
  '#2bd64e': 'var(--ok)',
  '#25b543': 'var(--ok-hover)',
  '#feba0a': 'var(--warn)',
  '#ff5f57': 'var(--err)',
  '#ff7570': 'var(--err-hover)',
  '#a78bfa': 'var(--purple)',
  '#fff': 'var(--white)',
  '#ffffff': 'var(--white)',
};

// rgba 映射
const RGBA_MAP = {
  'rgba(255,255,255,0.015)': 'var(--overlay-a15)',
  'rgba(255,255,255,0.01)': 'var(--overlay-a1)',
  'rgba(255,255,255,0.02)': 'var(--overlay-a2)',
  'rgba(255,255,255,0.03)': 'var(--overlay-a3)',
  'rgba(255,255,255,0.04)': 'var(--overlay-a4)',
  'rgba(255,255,255,0.05)': 'var(--overlay-a5)',
  'rgba(255,255,255,0.08)': 'var(--overlay-a8)',
  'rgba(255,255,255,0.1)': 'var(--overlay-a10)',
  'rgba(255,255,255,0.2)': 'var(--overlay-a20)',
  'rgba(0,212,255,0.02)': 'var(--accent-a2)',
  'rgba(0,212,255,0.03)': 'var(--accent-a3)',
  'rgba(0,212,255,0.04)': 'var(--accent-a4)',
  'rgba(0,212,255,0.05)': 'var(--accent-a5)',
  'rgba(0,212,255,0.06)': 'var(--accent-a6)',
  'rgba(0,212,255,0.08)': 'var(--accent-a8)',
  'rgba(0,212,255,0.1)': 'var(--accent-a10)',
  'rgba(0,212,255,0.12)': 'var(--accent-a12)',
  'rgba(0,212,255,0.15)': 'var(--accent-a15)',
  'rgba(0,212,255,0.2)': 'var(--accent-a20)',
  'rgba(0,212,255,0.25)': 'var(--accent-a25)',
  'rgba(0,212,255,0.3)': 'var(--accent-a30)',
  'rgba(0,212,255,0.5)': 'var(--accent-a50)',
  'rgba(0,0,0,0.03)': 'var(--scanline)',
  'rgba(0,0,0,0.5)': 'var(--shadow)',
  'rgba(0,0,0,0.7)': 'var(--shadow-deep)',
  'rgba(255,95,87,0.06)': 'var(--err-a6)',
  'rgba(255,95,87,0.08)': 'var(--err-a8)',
  'rgba(255,95,87,0.12)': 'var(--err-a12)',
  'rgba(255,95,87,0.15)': 'var(--err-a15)',
  'rgba(255,95,87,0.2)': 'var(--err-a20)',
  'rgba(255,95,87,0.25)': 'var(--err-a25)',
  'rgba(255,95,87,0.3)': 'var(--err-a30)',
  'rgba(43,214,78,0.06)': 'var(--ok-a6)',
  'rgba(43,214,78,0.08)': 'var(--ok-a8)',
  'rgba(43,214,78,0.1)': 'var(--ok-a10)',
  'rgba(43,214,78,0.12)': 'var(--ok-a12)',
  'rgba(43,214,78,0.2)': 'var(--ok-a20)',
  'rgba(43,214,78,0.3)': 'var(--ok-a30)',
  'rgba(43,214,78,0.4)': 'var(--ok-a40)',
  'rgba(254,186,10,0.08)': 'var(--warn-a8)',
  'rgba(254,186,10,0.2)': 'var(--warn-a20)',
  'rgba(10,10,12,0.88)': 'var(--navbar-bg)',
  'rgba(28,29,33,0.3)': 'var(--border-a30)',
  'rgba(28,29,33,0.5)': 'var(--border-a50)',
  'rgba(139,144,152,0.08)': 'var(--text-secondary-a8)',
  'rgba(139,144,152,0.2)': 'var(--text-secondary-a20)',
  'rgba(12,12,13,0.3)': 'var(--bg-deeper)',  // 罕见色，近似处理
};

let total = 0;
const perFile = {};

for (const file of FILES) {
  let src = fs.readFileSync(file, 'utf8');
  let count = 0;

  // 特判：accent 按钮上的文字色 #0a0a0c → --on-accent（先于全局 #0a0a0c 替换）
  const onAccentRe = /\bcolor:\s*#0a0a0c\b/g;
  const onAccentMatches = src.match(onAccentRe);
  if (onAccentMatches) {
    count += onAccentMatches.length;
    src = src.replace(onAccentRe, 'color: var(--on-accent)');
  }

  for (const [key, val] of Object.entries(HEX_MAP)) {
    const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const m = src.match(re);
    if (m) { count += m.length; src = src.replace(re, val); }
  }
  for (const [key, val] of Object.entries(RGBA_MAP)) {
    const re = new RegExp(key.replace(/[()]/g, '\\$&').replace(/\./g, '\\.'), 'g');
    const m = src.match(re);
    if (m) { count += m.length; src = src.replace(re, val); }
  }

  if (count > 0) {
    fs.writeFileSync(file, src);
    perFile[path.relative(ROOT, file)] = count;
    total += count;
  }
}

console.log('=== 替换完成 ===');
console.log('总替换数:', total);
console.log('文件数:', Object.keys(perFile).length);
for (const [f, c] of Object.entries(perFile)) console.log(`  ${f}: ${c}`);
