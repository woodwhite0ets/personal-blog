// ====== 指定日期攻击者分析 ======
// 用法: node deploy/analyze_date.js 2026-08-05
const fs = require('fs');
const zlib = require('zlib');

const dateArg = process.argv[2] || '2026-08-05';
const [y, m, d] = dateArg.split('-').map(Number);
// 北京时间 CST = UTC+8，该日 00:00 CST = 前一日 16:00 UTC
const startTs = Date.UTC(y, m - 1, d - 1, 16) / 1000;
const endTs = startTs + 24 * 3600;

const P = [
  { re: /\.env|\.git|\.aws|\.svn|backup|\.tar|\.zip|config\.json|Caddyfile|docker-compose|\.sql/i, label: '敏感文件探测' },
  { re: /wp-admin|wp-login|wordpress|wp-config|wp-includes|xmlrpc|wlwmanifest|wp-content/i, label: 'WordPress 扫描' },
  { re: /phpinfo|\.php|\.asp|\.jsp/i, label: 'PHP/脚本探测' },
  { re: /server-status|shell|manager|phpmyadmin/i, label: '后台/管理探测' },
  { re: /api\/auth\/login|api\/auth\/register|api\/auth\/guest|api\/auth\/forgot/i, label: '认证尝试' },
  { re: /api\/admin/i, label: '管理API探测' },
  { re: /api\/upload/i, label: '上传接口探测' },
  { re: /onerror|javascript:|<script|alert\(|prompt\(|eval\(/i, label: 'XSS特征' },
  { re: /union|select|information_schema|--/i, label: 'SQL注入特征' },
  { re: /__codex|anthropic|claude|cursor|openai/i, label: 'AI扫描器指纹' },
];

// 读全部日志(含轮转)
let lines = [];
try {
  for (const f of fs.readdirSync('/var/log/caddy')) {
    if (f === 'blog-access.log') {
      lines = lines.concat(fs.readFileSync(`/var/log/caddy/${f}`, 'utf8').split('\n'));
    } else if (f.startsWith('blog-access-') && f.endsWith('.gz')) {
      try { lines = lines.concat(zlib.gunzipSync(fs.readFileSync(`/var/log/caddy/${f}`)).toString('utf8').split('\n')); } catch {}
    }
  }
} catch (e) { console.log('读日志错误:', e.message); }

const ipMap = new Map();
for (const line of lines) {
  let j; try { j = JSON.parse(line); } catch { continue; }
  if (!j.request || j.ts < startTs || j.ts >= endTs) continue;
  const ip = j.request.client_ip;
  const uri = j.request.uri || '';
  if (!ipMap.has(ip)) ipMap.set(ip, { reqs: 0, labels: new Map(), first: j.ts, last: j.ts });
  const rec = ipMap.get(ip);
  rec.reqs++;
  if (j.ts < rec.first) rec.first = j.ts;
  if (j.ts > rec.last) rec.last = j.ts;
  for (const p of P) {
    if (p.re.test(uri)) rec.labels.set(p.label, (rec.labels.get(p.label) || 0) + 1);
  }
}

const fmt = ts => {
  const d2 = new Date(ts * 1000);
  return `${d2.getHours()}:${String(d2.getMinutes()).padStart(2, '0')}`;
};

console.log(`===== ${dateArg} (CST) 攻击者分析 =====`);
console.log(`活跃 IP 总数: ${ipMap.size}\n`);

let susCount = 0;
const sorted = [...ipMap.entries()].sort((a, b) => b[1].labels.size - a[1].labels.size);
for (const [ip, rec] of sorted) {
  if (rec.labels.size === 0) continue;
  susCount++;
  const labels = [...rec.labels.entries()].map(([k, v]) => `${k}×${v}`).join(', ');
  console.log(`■ ${ip} — ${rec.reqs} 请求, 活跃 ${fmt(rec.first)}-${fmt(rec.last)}`);
  console.log(`    可疑行为: ${labels}`);
  console.log('');
}
console.log(`可疑 IP 共 ${susCount} 个`);
