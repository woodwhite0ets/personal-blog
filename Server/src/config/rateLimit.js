const { rateLimit } = require('express-rate-limit');

// ====== 全局速率限制（所有请求） ======
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟窗口
  max: 200,            // 每分钟最多 200 个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many requests — slow down' },
});

// ====== 严格限制：登录（防暴力破解/喷口令，按 IP 计数） ======
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,              // 每 IP 每分钟最多 10 次登录尝试（防单账号爆破 + 多账号喷洒）
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many login attempts — try again in 1 minute' },
});

// ====== 严格限制：注册（防滥用） ======
const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,               // 每分钟最多 3 次注册
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many registration attempts — try again in 1 minute' },
});

// ====== 严格限制：重发验证邮件 ======
const resendVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many email requests — try again in 1 minute' },
});

// ====== 宽松限制：上传文件 ======
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many uploads — slow down' },
});

// ====== 严格限制：按邮箱（防邮件轰炸 — 多 IP 换着打同一邮箱也限住） ======
const emailResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 3,                   // 每邮箱每小时最多 3 次重置/重发请求
  ipv6Subnet: 64,           // IPv6 键规范化（防 ERR_ERL_KEY_GEN_IPV6）
  keyGenerator: (req) => {
    const e = req.body && typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return e || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many email requests for this address — try again later' },
});

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  resendVerifyLimiter,
  emailResetLimiter,
  uploadLimiter,
};
