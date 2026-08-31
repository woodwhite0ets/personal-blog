const fs = require('fs');
const https = require('https');
require('dotenv').config();
const { transporter } = require('./src/config/mail.js');

const HEALTH_URL = process.env.HEALTH_URL || 'https://blog.woodwhite.top/healthz';
const STATE = '/home/ubuntu/personal-blog/Server/logs/health-state.json';
const LOG = '/home/ubuntu/personal-blog/Server/logs/health.log';
const EMAIL = process.env.ALERT_EMAIL || process.env.MAIL_USER;
const THRESHOLD = 3;

function load() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { fails: 0, alerted: false }; } }
function save(s) { fs.writeFileSync(STATE, JSON.stringify(s)); }
function log(l) { fs.appendFileSync(LOG, new Date().toISOString() + ' ' + l + '\n'); }

https.get(HEALTH_URL, (res) => {
  let b = ''; res.on('data', d => b += d); res.on('end', () => settle(res.statusCode === 200 && /"status":"ok"/.test(b)));
}).on('error', () => settle(false));

function settle(ok) {
  const s = load();
  if (ok) {
    if (s.alerted) { log('RECOVERED'); alert('RECOVERED'); }
    save({ fails: 0, alerted: false });
  } else {
    s.fails++;
    log(`FAIL ${s.fails}/${THRESHOLD}`);
    if (s.fails >= THRESHOLD && !s.alerted) { s.alerted = true; alert('OUTAGE'); }
    save(s);
  }
}

function alert(kind) {
  if (!EMAIL) { log('NO_EMAIL_TARGET'); return; }
  transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: EMAIL,
    subject: `[woodwhite] 网关${kind === 'OUTAGE' ? '故障' : '已恢复'}`,
    text: `${new Date().toISOString()} ${kind} — ${HEALTH_URL}\n连续探测失败达阈值，请检查隧道/网关。`
  }).then(() => log('ALERT_SENT ' + kind)).catch(e => log('ALERT_FAIL ' + e.message));
}
