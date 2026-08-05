const jwt = require('jsonwebtoken');
const pool = require('../config/db');
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

// ====== 从 DB 刷新用户的实时 role（降权/删号即时生效） ======
async function refreshUser(payload) {
  // 游客 token (id=0) 直接使用
  if (payload.id === 0) return { ...payload, isGuest: true };
  const [rows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [payload.id]);
  if (rows.length === 0) return null; // 账号已被删除
  return { ...payload, role: rows[0].role };
}

// ====== JWT 验证中间件（必需） ======
async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const user = await refreshUser(payload);
    if (!user) {
      return res.status(401).json({ message: 'account no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'invalid or expired token' });
    }
    return res.status(500).json({ message: 'internal server error' });
  }
}

// ====== JWT 验证中间件（可选 — 不传 token 也能过，传了则解析） ======
async function authOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      const user = await refreshUser(payload);
      if (user) req.user = user; // 账号已删除则不设置
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
