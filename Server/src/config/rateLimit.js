const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// ====== 全局速率限制（所有请求） ======
const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟窗口
  max: 200,            // 每分钟最多 200 个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many requests — slow down' },
});

// ====== 严格限制：登录（防暴力破解，按 IP + 账号联合） ======
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,               // 每分钟每 IP+账号 最多 5 次登录尝试
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const username = (req.body && req.body.username) || '';
    const ip = ipKeyGenerator(req);  // 正确处理 IPv4/IPv6
    return `${ip}:${username}`;
  },
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

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  resendVerifyLimiter,
  uploadLimiter,
};
