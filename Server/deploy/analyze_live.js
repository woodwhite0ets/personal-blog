// ====== 实时攻击观察（最近 N 分钟，只看不封） ======
// 用法: node deploy/analyze_live.js [分钟]
const fs = require('fs');

const minutes = parseInt(process.argv[2] || '30', 10);
const sinceTs = Date.now() / 1000 - minutes * 60;

// 可疑模式分类
const P = [
  { re: /\.env|\.git|\.aws|\.svn|backup|\.tar|\.zip|config\.json|Caddyfile|docker-compose/i, label: '敏感文件探测' },
  { re: /wp-admin|wp-login|wordpress|wp-config|wp-includes|xmlrpc|wlwmanifest|wp-content/i, label: 'WordPress 扫描' },
  { re: /phpinfo|\.php|\.asp|\.jsp/i, label: 'PHP/脚本探测' },
  { re: /admin|server-status|shell|manager/i, label: '后台/管理接口' },
  { re: /api\/auth\/login|api\/auth\/register|api\/auth\/guest/i, label: '认证尝试' },
  { re: /api\/admin/i, label: '管理API探测' },
  { re: /api\/upload/i, label: '上传接口探测' },
  { re: /onerror|javascript:|<script|alert\(|prompt\(|eval\(/i, label: 'XSS特征' },
  { re: /union|select|information_schema|--|\.sql/i, label: 'SQL注入特征' },
  { re: /__codex|anthropic|claude|cursor/i, label: 'AI扫描器指纹' },
];

// 读 Caddy 日志(含轮转 gz)
function readCaddyLogs() {
  const dir = '/var/log/caddy';
  let lines = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      if (f === 'blog-access.log') {
        lines = lines.concat(fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n'));
      } else if (f.startsWith('blog-access-') && f.endsWith('.gz')) {
        const zlib = require('zlib');
        try {
          lines = lines.concat(zlib.gunzipSync(fs.readFileSync(`${dir}/${f}`)).toString('utf8').split('\n'));
        } catch {}
      }
    }
  } catch (e) { console.log('读日志出错:', e.message); }
  return lines.filter(Boolean);
}

// Caddy 分析
const ipMap = new Map();
const caddyLines = readCaddyLogs();
for (const line of caddyLines) {
  let j; try { j = JSON.parse(line); } catch { continue; }
  if (!j.request || j.ts < sinceTs) continue;
  const ip = j.request.client_ip;
  const uri = j.request.uri || '';
  const method = j.request.method || 'GET';
  if (!ipMap.has(ip)) ipMap.set(ip, { reqs: [], labels: new Set(), last: 0 });
  const rec = ipMap.get(ip);
  rec.reqs.push({ ts: j.ts, method, uri, status: j.status });
  if (j.ts > rec.last) rec.last = j.ts;
  for (const p of P) {
    if (p.re.test(uri)) rec.labels.add(p.label);
  }
}

console.log(`===== 最近 ${minutes} 分钟 Web 攻击观察 =====`);
const t = new Date();
const nowStr = `${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;
console.log(`当前时间: ${nowStr}\n`);

let suspiciousTotal = 0;
const sorted = [...ipMap.entries()].sort((a, b) => b[1].reqs.length - a[1].reqs.length);
for (const [ip, rec] of sorted) {
  if (rec.labels.size === 0) continue;
  suspiciousTotal++;
  const d = new Date(rec.last * 1000);
  const last = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  console.log(`■ ${ip}  — ${rec.reqs.length} 请求, 最后活动 ${last}, 类型: [${[...rec.labels].join(', ')}]`);
  // 展示最后 3 个可疑请求
  const sus = rec.reqs.filter(r => P.some(p => p.re.test(r.uri))).slice(-3);
  sus.forEach(r => {
    const dd = new Date(r.ts * 1000);
    const tt = `${dd.getHours()}:${String(dd.getMinutes()).padStart(2,'0')}:${String(dd.getSeconds()).padStart(2,'0')}`;
    console.log(`    ${tt} ${r.method} ${r.uri.slice(0, 120)} → ${r.status}`);
  });
  console.log('');
}
console.log(`可疑 IP 共 ${suspiciousTotal} 个\n`);

// SSH 分析
console.log('===== 最近 SSH 爆破尝试 =====');
const { execSync } = require('child_process');
try {
  const out = execSync(`journalctl -u ssh --since "${minutes} minutes ago" --no-pager 2>/dev/null | grep -E "Failed password|invalid user" || true`, { encoding: 'utf8' });
  if (!out.trim()) {
    console.log('(最近无 SSH 爆破记录)');
  } else {
    const sshMap = new Map();
    for (const line of out.split('\n')) {
      const m = line.match(/from ([\d.]+)/);
      const u = line.match(/(?:invalid user|Failed password for)\s+(\S+)/);
      if (m) {
        const ip = m[1];
        const user = u ? u[1] : '?';
        if (!sshMap.has(ip)) sshMap.set(ip, { count: 0, users: new Set() });
        sshMap.get(ip).count++;
        sshMap.get(ip).users.add(user);
      }
    }
    for (const [ip, v] of [...sshMap.entries()].sort((a,b)=>b[1].count-a[1].count)) {
      console.log(`■ SSH爆破 ${ip} — ${v.count} 次, 尝试用户: [${[...v.users].join(', ')}]`);
    }
  }
} catch (e) {
  console.log('SSH 查询失败:', e.message);
}
