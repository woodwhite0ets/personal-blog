const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { signToken, authRequired, authNoGuest } = require('../middleware/auth');
const { sendVerificationEmail } = require('../config/mail');
const { loginLimiter, registerLimiter, resendVerifyLimiter } = require('../config/rateLimit');

// 导入通用限制器（guest 防滥用）
const rateLimit = require('express-rate-limit');
const guestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many guest requests — slow down' },
});

const router = express.Router();

// ====== POST /api/auth/register ======
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, nickname, email, password } = req.body;

    if (!username || !nickname || !email || !password) {
      return res.status(400).json({ message: 'all fields are required' });
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ message: 'username: 3-20 chars, letters/numbers/underscore only' });
    }
    // 密码强度：至少 8 位，包含字母和数字
    if (password.length < 8) {
      return res.status(400).json({ message: 'password must be at least 8 characters' });
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({ message: 'password must contain both letters and numbers' });
    }
    // 长度上限（防超长密码攻击）
    if (password.length > 128) {
      return res.status(400).json({ message: 'password too long' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'invalid email format' });
    }
    // 昵称长度限制
    if (nickname.length > 50) {
      return res.status(400).json({ message: 'nickname too long (max 50 chars)' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'username or email already taken' });
    }

    // 生成验证令牌
    const verify_token = crypto.randomBytes(32).toString('hex');
    const verify_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小时

    const password_hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (username, nickname, email, password_hash, verify_token, verify_expires)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, nickname, email, password_hash, verify_token, verify_expires]
    );

    // 尝试发邮件（mail 未配置也不阻塞注册）
    try {
      await sendVerificationEmail(email, username, verify_token);
    } catch (mailErr) {
      console.warn('Failed to send verification email:', mailErr.message);
    }

    // 注册成功，但不自动登录 → 前端展示"去邮箱验证"
    res.status(201).json({
      message: 'registration successful — please check your email to verify',
      email,
    });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/auth/verify-email/:token ======
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await pool.query(
      'SELECT id, username, role, verify_expires, is_verified FROM users WHERE verify_token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'invalid verification link' });
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.json({ message: 'email already verified — you can log in', verified: true });
    }

    if (new Date() > new Date(user.verify_expires)) {
      return res.status(410).json({ message: 'verification link expired — please register again' });
    }

    // 标记已验证
    await pool.query(
      'UPDATE users SET is_verified = 1, verify_token = NULL, verify_expires = NULL WHERE id = ?',
      [user.id]
    );

    // 验证成功，自动签发 JWT
    const tokenJwt = signToken({ id: user.id, username: user.username, role: user.role });

    res.json({
      message: 'email verified — welcome!',
      verified: true,
      token: tokenJwt,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/auth/resend-verification ======
router.post('/resend-verification', resendVerifyLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, is_verified, verify_token, verify_expires FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'no account found with this email' });
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.json({ message: 'this email is already verified — please log in' });
    }

    // 重新生成 token
    const verify_token = crypto.randomBytes(32).toString('hex');
    const verify_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verify_token = ?, verify_expires = ? WHERE id = ?',
      [verify_token, verify_expires, user.id]
    );

    try {
      await sendVerificationEmail(email, user.username, verify_token);
    } catch (mailErr) {
      console.warn('Failed to resend verification email:', mailErr.message);
    }

    res.json({ message: 'verification email resent' });
  } catch (err) {
    console.error('resend error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/auth/login — 加 is_verified 检查 + 限流 ======
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, nickname, email, bio, avatar, role, is_verified, password_hash FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'invalid username or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'invalid username or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: 'please verify your email before logging in',
        code: 'UNVERIFIED',
        email: user.email,
      });
    }

    delete user.password_hash;
    const token = signToken(user);

    res.json({ message: 'login successful', token, user });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== GET /api/auth/me ======
router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, nickname, email, bio, avatar, role, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error('me error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== PUT /api/auth/change-password — 修改密码 ======
router.put('/change-password', authRequired, authNoGuest, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'old and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'new password must be at least 8 characters' });
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ message: 'new password must contain both letters and numbers' });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ message: 'new password too long' });
    }

    // 查当前密码哈希
    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    // 验证旧密码
    const match = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!match) {
      return res.status(403).json({ message: 'incorrect current password' });
    }

    // 更新密码
    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ message: 'password changed successfully' });
  } catch (err) {
    console.error('change password error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/auth/guest ======
router.post('/guest', guestLimiter, async (req, res) => {
  try {
    const guestId = 'guest-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const guestUser = {
      id: 0,
      username: guestId,
      nickname: 'Guest',
      role: 'reader',
      isGuest: true,
    };
    const token = signToken(guestUser);

    res.json({
      message: 'guest mode activated',
      token,
      user: { ...guestUser, is_verified: false, bio: '', avatar: null, created_at: new Date().toISOString() },
    });
  } catch (err) {
    console.error('guest error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

module.exports = router;
