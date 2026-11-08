const nodemailer = require('nodemailer');
require('dotenv').config();

// ====== 创建 transporter ======
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.qq.com',
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false, // 587 → STARTTLS
  auth: {
    user: process.env.MAIL_USER || '',
    pass: process.env.MAIL_PASS || '',
  },
});

// ====== 验证邮件配置是否正确 ======
transporter.verify().then(() => {
  console.log('Mail server ready');
}).catch(err => {
  console.warn('Mail server NOT configured — verification emails disabled');
  console.warn('  → Reason:', err.message);
  console.warn('  → Set MAIL_HOST / MAIL_USER / MAIL_PASS in .env to enable');
});

// ====== 发送验证邮件 ======
// ====== 全局邮件发送节流（防邮件轰炸拖垮 SMTP 配额 / 服务器资源） ======
const _mailTimestamps = [];
const MAIL_WINDOW_MS = 60 * 1000; // 60 秒窗口
const MAIL_MAX_PER_WINDOW = 10;   // 每 60 秒最多 10 封（单进程内存计数，PM2 fork 单实例有效）
function assertMailRate() {
  const now = Date.now();
  while (_mailTimestamps.length && now - _mailTimestamps[0] > MAIL_WINDOW_MS) {
    _mailTimestamps.shift();
  }
  if (_mailTimestamps.length >= MAIL_MAX_PER_WINDOW) {
    throw new Error(`mail rate limit reached (${MAIL_MAX_PER_WINDOW}/min)`);
  }
  _mailTimestamps.push(now);
}


async function sendVerificationEmail(to, username, token) {
  assertMailRate(); // 全局邮件节流（防轰炸）
  const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
  const verifyUrl = `${siteUrl}/verify-email/${token}`;

  const html = `
    <div style="font-family:monospace;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0c;color:#c9d1d9;border:1px solid #1c1d21;border-radius:8px;">
      <div style="font-size:18px;font-weight:700;color:#00d4ff;margin-bottom:24px;">
        ❯ verify your email
      </div>
      <p style="font-size:14px;color:#8b9098;margin-bottom:24px;">
        Hey <strong style="color:#e6edf3;">@${username}</strong>,<br/>
        thanks for signing up! Click the button below to verify your email.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;font-weight:700;color:#0a0a0c;background:#00d4ff;border-radius:6px;text-decoration:none;font-size:14px;letter-spacing:1px;">
        Verify
      </a>
      <p style="font-size:11px;color:#484b52;margin-top:24px;">
        Button not working? Copy this link into your browser:<br/>
        <span style="color:#6e737a;">${verifyUrl}</span>
      </p>
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #1c1d21;font-size:10px;color:#33363c;">
        blogOS v2.0.1
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@blog.local',
    to,
    subject: `[woodwhite@blog] verify your email`,
    html,
  });
}

// ====== 发送重置密码邮件 ======
async function sendResetPasswordEmail(to, username, token) {
  assertMailRate(); // 全局邮件节流（防轰炸）
  const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
  const resetUrl = `${siteUrl}/reset-password/${token}`;

  const html = `
    <div style="font-family:monospace;max-width:520px;margin:0 auto;padding:32px;background:#0a0a0c;color:#c9d1d9;border:1px solid #1c1d21;border-radius:8px;">
      <div style="font-size:18px;font-weight:700;color:#ffb454;margin-bottom:24px;">
        ❯ reset your password
      </div>
      <p style="font-size:14px;color:#8b9098;margin-bottom:24px;">
        Hey <strong style="color:#e6edf3;">@${username}</strong>,<br/>
        you requested a password reset. Click the button below to set a new password.
      </p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;font-weight:700;color:#0a0a0c;background:#ffb454;border-radius:6px;text-decoration:none;font-size:14px;letter-spacing:1px;">
        Reset Password
      </a>
      <p style="font-size:11px;color:#484b52;margin-top:24px;">
        Button not working? Copy this link into your browser:<br/>
        <span style="color:#6e737a;">${resetUrl}</span>
      </p>
      <p style="font-size:11px;color:#484b52;margin-top:16px;">
        This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
      </p>
      <div style="margin-top:28px;padding-top:16px;border-top:1px solid #1c1d21;font-size:10px;color:#33363c;">
        blogOS v2.0.1
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER || 'noreply@blog.local',
    to,
    subject: `[woodwhite@blog] reset your password`,
    html,
  });
}

// ====== 公司站联系表单：转发到站长邮箱，回复地址是访客留的联系方式 ======
async function sendContactEmail({ name, contact, message, meta }) {
  assertMailRate();
  const owner = process.env.MAIL_USER || process.env.MAIL_FROM;
  if (!owner) throw new Error('mail not configured');

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact);

  const html = `
    <div style="font-family:-apple-system,'PingFang SC',sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#faf8f5;color:#16181c;border:1px solid #e6e8ec;border-radius:12px;">
      <div style="font-size:15px;font-weight:700;color:#b8452f;margin-bottom:18px;">woodwhite.top 收到一条咨询</div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.7;">
        <tr><td style="width:76px;color:#687078;">称呼</td><td>${esc(name)}</td></tr>
        <tr><td style="color:#687078;">联系</td><td>${esc(contact)}</td></tr>
        <tr><td style="color:#687078;">来源</td><td>${esc(meta || '未知')}</td></tr>
      </table>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e6e8ec;font-size:14px;line-height:1.8;white-space:pre-wrap;">${esc(message)}</div>
    </div>
  `;

  return transporter.sendMail({
    from: process.env.MAIL_FROM || owner,
    to: owner,
    replyTo: isEmail ? contact : undefined,
    subject: `[woodwhite.top] 咨询：${String(name).slice(0, 20)}`,
    html,
  });
}

module.exports = { transporter, sendVerificationEmail, sendResetPasswordEmail, sendContactEmail };
