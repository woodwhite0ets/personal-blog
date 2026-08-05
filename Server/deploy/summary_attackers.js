// ===== 今日攻击者总结：按 IP 聚合可疑行为 =====
// 解析今天（CST 0点起）的 Caddy 访问日志，识别探测/攻击行为
const fs = require('fs');

const logFile = '/var/log/caddy/blog-access.log';
const now = new Date();
const todayStartUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0) - 8*3600*1000; // 北京 00:00 → UTC
const todayStartTs = todayStartUTC / 1000;

const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
const ips = new Map(); // ip -> {reqs: [], methods: Set, statuses: [], suspicious: []}

// 可疑请求模式
const PROBE_PATTERNS = [
  { re: /\.env|\.git|\.aws|\.svn|\.DS_Store/i, label: '敏感文件探测(.env/.git)' },
  { re: /wp-admin|wp-login|wordpress/i, label: 'WordPress 扫描' },
  { re: /phpinfo|\.php/i, label: 'PHP 探测' },
  { re: /admin|server-status|config\.json|backup|\.tar\.gz|\.zip/i, label: '后台/备份文件探测' },
  { re: /api\/auth\/register|api\/auth\/login|api\/auth\/guest/i, label: '注册/登录尝试' },
  { re: /__codex/i, label: 'Codex 探测指纹' },
  { re: /api\/admin/i, label: '管理接口探测' },
  { re: /api\/upload/i, label: '上传接口探测' },
  { re: /onerror|javascript:|<script|alert\(|prompt\(|confirm\(/i, label: 'XSS 特征' },
  { re: /sql|union|select|insert|information_schema|--/i, label: 'SQL 注入特征' },
  { re: /\.sql|phpMyAdmin|phpmyadmin/i, label: '数据库文件探测' },
];

for (const line of lines) {
  let j;
  try { j = JSON.parse(line); } catch { continue; }
  if (!j.request || j.ts < todayStartTs) continue;
  const ip = j.request.client_ip;
  const uri = j.request.uri || '';
  const method = j.request.method || 'GET';
  const status = j.status;
  if (!ips.has(ip)) {
    ips.set(ip, { reqs: [], methods: new Set(), statuses: new Set(), suspicious: [], first: j.ts, last: j.ts });
  }
  const rec = ips.get(ip);
  rec.reqs.push({ ts: j.ts, method, uri, status });
  rec.methods.add(method);
  rec.statuses.add(status);
  if (j.ts < rec.first) rec.first = j.ts;
  if (j.ts > rec.last) rec.last = j.ts;
  for (const p of PROBE_PATTERNS) {
    if (p.re.test(uri) && !rec.suspicious.some(s => s.uri === uri)) {
      rec.suspicious.push({ label: p.label, method, uri, status });
    }
  }
}

const fmtTs = ts => {
  const d = new Date(ts * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

console.log(`===== 今日（北京时间 00:00 起）访问日志分析 =====`);
console.log(`总请求数（今日）: ${lines.filter(l => { try { const j = JSON.parse(l); return j.ts >= todayStartTs; } catch { return false; } }).length}`);
console.log(`独立 IP 数: ${ips.size}\n`);

// 按可疑度排序输出
const sorted = [...ips.entries()].sort((a, b) => b[1].suspicious.length - a[1].suspicious.length);
for (const [ip, rec] of sorted) {
  const total = rec.reqs.length;
  const sus = rec.suspicious.length;
  console.log(`■ IP ${ip}  — ${total} 请求, ${sus} 类可疑, 活跃 ${fmtTs(rec.first)}-${fmtTs(rec.last)}`);
  if (sus === 0) { console.log('  （无可疑行为，疑似正常访客）'); continue; }
  // 去重展示可疑请求（按 label 分组）
  const seen = new Set();
  for (const s of rec.suspicious) {
    const key = s.label;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`  🔍 ${s.label}: ${s.method} ${s.uri.slice(0, 100)} → ${s.status}`);
  }
  console.log('');
}
