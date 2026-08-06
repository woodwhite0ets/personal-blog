# -*- coding: utf-8 -*-
# 加固：防邮件轰炸
# 1. rateLimit.js 新增按邮箱限流 emailResetLimiter
# 2. mail.js 新增全局邮件发送滑动窗口节流
# 3. auth.js 的 forgot-password / resend-verification 叠加邮箱级限流
import io

BASE = r'C:\Users\19037\Desktop\Blog\Server\src' + '\\'
EOL = '\r\n'

def load(p):
    with io.open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()

def save(p, content):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

# ========== 1. rateLimit.js ==========
p = BASE + r'config\rateLimit.js'
c = load(p)

emailLimiter = (
    EOL.join([
        '// ====== 严格限制：按邮箱（防邮件轰炸 — 多 IP 换着打同一邮箱也限住） ======',
        'const emailResetLimiter = rateLimit({',
        '  windowMs: 60 * 60 * 1000, // 1 小时',
        '  max: 3,                   // 每邮箱每小时最多 3 次重置/重发请求',
        '  keyGenerator: (req) => {',
        "    const e = req.body && typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';",
        '    return e || req.ip;',
        '  },',
        '  standardHeaders: true,',
        '  legacyHeaders: false,',
        "  message: { message: 'too many email requests for this address — try again later' },",
        '});',
        '',
    ]) + EOL
)

anchor1 = "  message: { message: 'too many uploads — slow down' }," + EOL + '});' + EOL + EOL + 'module.exports = {'
assert c.count(anchor1) == 1, 'anchor1 count=%d' % c.count(anchor1)
c = c.replace(anchor1, "  message: { message: 'too many uploads — slow down' }," + EOL + '});' + EOL + EOL + emailLimiter + 'module.exports = {')

anchor2 = '  registerLimiter,' + EOL + '  resendVerifyLimiter,' + EOL + '  uploadLimiter,' + EOL + '};'
assert c.count(anchor2) == 1, 'anchor2 count=%d' % c.count(anchor2)
c = c.replace(anchor2, '  registerLimiter,' + EOL + '  resendVerifyLimiter,' + EOL + '  emailResetLimiter,' + EOL + '  uploadLimiter,' + EOL + '};')
save(p, c)
print('rateLimit.js OK')

# ========== 2. mail.js ==========
p = BASE + r'config\mail.js'
c = load(p)

mailThrottle = (
    EOL.join([
        '// ====== 全局邮件发送节流（防邮件轰炸拖垮 SMTP 配额 / 服务器资源） ======',
        'const _mailTimestamps = [];',
        'const MAIL_WINDOW_MS = 60 * 1000; // 60 秒窗口',
        'const MAIL_MAX_PER_WINDOW = 10;   // 每 60 秒最多 10 封（单进程内存计数，PM2 fork 单实例有效）',
        'function assertMailRate() {',
        '  const now = Date.now();',
        '  while (_mailTimestamps.length && now - _mailTimestamps[0] > MAIL_WINDOW_MS) {',
        '    _mailTimestamps.shift();',
        '  }',
        '  if (_mailTimestamps.length >= MAIL_MAX_PER_WINDOW) {',
        '    throw new Error(`mail rate limit reached (${MAIL_MAX_PER_WINDOW}/min)`);',
        '  }',
        '  _mailTimestamps.push(now);',
        '}',
        '',
        '',
    ]) + EOL
)

anchor3 = 'async function sendVerificationEmail(to, username, token) {' + EOL + '  const siteUrl'
assert c.count(anchor3) == 1, 'anchor3 count=%d' % c.count(anchor3)
c = c.replace(anchor3, mailThrottle + 'async function sendVerificationEmail(to, username, token) {' + EOL + '  assertMailRate(); // 全局邮件节流（防轰炸）' + EOL + '  const siteUrl')

anchor4 = 'async function sendResetPasswordEmail(to, username, token) {' + EOL + '  const siteUrl'
assert c.count(anchor4) == 1, 'anchor4 count=%d' % c.count(anchor4)
c = c.replace(anchor4, 'async function sendResetPasswordEmail(to, username, token) {' + EOL + '  assertMailRate(); // 全局邮件节流（防轰炸）' + EOL + '  const siteUrl')
save(p, c)
print('mail.js OK')

# ========== 3. auth.js ==========
p = BASE + r'routes\auth.js'
c = load(p)

anchor5 = "const { loginLimiter, registerLimiter, resendVerifyLimiter } = require('../config/rateLimit');"
assert c.count(anchor5) == 1, 'anchor5 count=%d' % c.count(anchor5)
c = c.replace(anchor5, "const { loginLimiter, registerLimiter, resendVerifyLimiter, emailResetLimiter } = require('../config/rateLimit');")

anchor6 = "router.post('/forgot-password', resendVerifyLimiter, async (req, res) => {"
assert c.count(anchor6) == 1, 'anchor6 count=%d' % c.count(anchor6)
c = c.replace(anchor6, "router.post('/forgot-password', resendVerifyLimiter, emailResetLimiter, async (req, res) => {")

anchor7 = "router.post('/resend-verification', resendVerifyLimiter, async (req, res) => {"
assert c.count(anchor7) == 1, 'anchor7 count=%d' % c.count(anchor7)
c = c.replace(anchor7, "router.post('/resend-verification', resendVerifyLimiter, emailResetLimiter, async (req, res) => {")
save(p, c)
print('auth.js OK')

print('All done.')
