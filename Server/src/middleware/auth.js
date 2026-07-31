const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT_SECRET 必须显式配置，缺失时直接抛错（防止静默使用弱默认值伪造 token）
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set in .env (at least 32 chars)');
}

// ====== 生成 JWT ======
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ====== JWT 验证中间件（必需） ======
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'authentication required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'invalid or expired token' });
  }
}

// ====== JWT 验证中间件（可选 — 不传 token 也能过，传了则解析） ======
function authOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch { /* token 无效也放行 */ }
  }
  next();
}

// ====== 禁止游客（需在 authRequired 之后使用） ======
// 游客 JWT 的 id 恒为 0，所有"真实用户"写操作必须排除
function authNoGuest(req, res, next) {
  if (!req.user || req.user.id === 0 || req.user.isGuest) {
    return res.status(403).json({ message: 'guest accounts cannot do this' });
  }
  next();
}

// ====== 管理员权限中间件（需在 authRequired 之后使用） ======
function authAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'admin access required' });
  }
  next();
}

module.exports = { signToken, authRequired, authOptional, authNoGuest, authAdmin };
