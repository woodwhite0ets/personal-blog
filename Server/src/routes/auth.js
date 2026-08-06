const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { signToken, authRequired, authNoGuest } = require('../middleware/auth');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../config/mail');
const { loginLimiter, registerLimiter, resendVerifyLimiter, emailResetLimiter } = require('../config/rateLimit');
const { createCaptcha, verifyCaptcha } = require('../config/captcha');
const { containsBannedWord } = require('../config/wordFilter');

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

// ====== GET /api/auth/captcha — 图形验证码（防批量注册） ======
const captchaLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,              // 每 IP 每分钟最多 20 次获取验证码
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'too many captcha requests — slow down' },
});
router.get('/captcha', captchaLimiter, (req, res) => {
  try {
    const { id, svg } = createCaptcha();
    res.json({ captcha_id: id, svg });
  } catch (err) {
    console.error('captcha error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/auth/register ======
router.post('/register', registerLimiter, async (req, res) => {
  try {
    // 图形验证码校验（防批量注册/机器人）
    const { captcha_id, captcha_text } = req.body || {};
    if (!verifyCaptcha(captcha_id, captcha_text)) {
      return res.status(400).json({ message: 'captcha verification failed — please refresh and try again' });
    }

    const { username, nickname, password } = req.body;

    // 违禁词检查（用户名/昵称，防挑衅辱骂）
    if (containsBannedWord(username) || containsBannedWord(nickname)) {
      return res.status(400).json({ message: 'username or nickname contains inappropriate words' });
    }
    let email = req.body.email; // 需可重新赋值（后续小写化）

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
    // 统一小写（防忘记密码/重发验证时大小写不一致导致收不到邮件）
    email = email.trim().toLowerCase();
    // 昵称长度限制
    if (nickname.length > 50) {
      return res.status(400).json({ message: 'nickname too long (max 50 chars)' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      // 语义模糊化 + 时序拉平（bcrypt 耗时一致，防用户名/邮箱枚举）
      await bcrypt.hash(password, 12);
      return res.status(201).json({
        message: 'registration initiated — please check your email to verify your account',
      });
    }

    // 生成验证令牌
    const verify_token = crypto.randomBytes(32).toString('hex');
    const verify_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 小时

    const password_hash = await bcrypt.hash(password, 12);
    // 记录注册客户端 IP（配合 Caddy 反代 X-Forwarded-For；Node 绑定 127.0.0.1 只能经 Caddy 访问，无法伪造）
    const registerIp = req.ip || null;
    try {
      const [result] = await pool.query(
        `INSERT INTO users (username, nickname, email, password_hash, verify_token, verify_expires, register_ip)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [username, nickname, email, password_hash, verify_token, verify_expires, registerIp]
      );
    } catch (err) {
      // 并发注册同用户名/邮箱 → 唯一键冲突，返回与已存在一致的响应
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(201).json({
          message: 'registration initiated — please check your email to verify your account',
        });
      }
      throw err;
    }

    // 尝试发邮件（mail 未配置也不阻塞注册）
    try {
      await sendVerificationEmail(email, username, verify_token);
    } catch (mailErr) {
      console.warn('Failed to send verification email:', mailErr.message);
    }

    // 注册成功，但不自动登录 → 前端展示"去邮箱验证"（响应不含 email，防枚举）
    res.status(201).json({
      message: 'registration successful — please check your email to verify',
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
router.post('/resend-verification', resendVerifyLimiter, emailResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }
    // 统一小写（与注册入库时一致，防大小写不一致导致查不到账号）
    const normalizedEmail = email.trim().toLowerCase();

    const [rows] = await pool.query(
      'SELECT id, username, is_verified, verify_token, verify_expires FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      // 语义模糊化，避免邮箱枚举
      return res.json({ message: 'if this email is registered, a verification email has been sent' });
    }

    const user = rows[0];

    if (user.is_verified) {
      return res.json({ message: 'if this email is registered, a verification email has been sent' });
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
      return res.status(401).json({ message: 'invalid username or password' });
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

// ====== POST /api/auth/forgot-password — 发送重置密码邮件 ======
router.post('/forgot-password', resendVerifyLimiter, emailResetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'email is required' });
    }

    // 语义模糊化：无论邮箱是否存在都返回成功（防枚举）
    const successMsg = { message: 'if this email is registered, a reset link has been sent' };

    const [rows] = await pool.query(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );
    if (rows.length === 0) {
      return res.json(successMsg);
    }

    const user = rows[0];
    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 小时

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?',
      [reset_token, reset_expires, user.id]
    );

    // 尝试发邮件（失败不阻塞，但记录日志）
    try {
      await sendResetPasswordEmail(user.email, user.username, reset_token);
    } catch (mailErr) {
      console.warn('forgot-password mail error:', mailErr.message);
    }

    res.json(successMsg);
  } catch (err) {
    console.error('forgot password error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== POST /api/auth/reset-password — 用 token 重置密码 ======
router.post('/reset-password', registerLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'token and new password are required' });
    }
    if (newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      return res.status(400).json({ message: 'password must be at least 8 chars with letters and numbers' });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ message: 'password too long (max 128 chars)' });
    }

    const [rows] = await pool.query(
      'SELECT id FROM users WHERE reset_token = ?',
      [token]
    );
    if (rows.length === 0) {
      return res.status(400).json({ message: 'invalid or expired reset link' });
    }

    const user = rows[0];
    const [userRow] = await pool.query(
      'SELECT reset_expires FROM users WHERE id = ?',
      [user.id]
    );
    const resetExpires = userRow[0]?.reset_expires;
    if (!resetExpires || new Date() > new Date(resetExpires)) {
      return res.status(410).json({ message: 'reset link expired — please request a new one' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [password_hash, user.id]
    );

    res.json({ message: 'password reset successful — please log in' });
  } catch (err) {
    console.error('reset password error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== PUT /api/auth/profile — 更新个人资料（昵称/bio/邮箱） ======
router.put('/profile', authRequired, authNoGuest, async (req, res) => {
  try {
    const { nickname, bio, email } = req.body;

    // 校验昵称
    let newNickname;
    if (nickname !== undefined) {
      if (typeof nickname !== 'string' || nickname.trim().length === 0 || nickname.trim().length > 50) {
        return res.status(400).json({ message: 'nickname must be 1-50 characters' });
      }
      newNickname = nickname.trim().replace(/<[^>]*>/g, '').slice(0, 50);
      // 违禁词检查
      if (containsBannedWord(newNickname)) {
        return res.status(400).json({ message: 'nickname contains inappropriate words' });
      }
    }

    // 校验 bio（users.bio 列为 VARCHAR(300)）
    let newBio;
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 300) {
        return res.status(400).json({ message: 'bio too long (max 300 chars)' });
      }
      newBio = bio.trim().replace(/<[^>]*>/g, '').slice(0, 300);
      // 违禁词检查
      if (containsBannedWord(newBio)) {
        return res.status(400).json({ message: 'bio contains inappropriate words' });
      }
    }

    // 当前用户
    const [currentRows] = await pool.query(
      'SELECT email, is_verified FROM users WHERE id = ?',
      [req.user.id]
    );
    if (currentRows.length === 0) {
      return res.status(404).json({ message: 'user not found' });
    }
    const currentUser = currentRows[0];

    // 邮箱变更处理
    let emailChanged = false;
    let newEmail;
    if (email !== undefined) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'invalid email format' });
      }
      newEmail = email.trim().toLowerCase();
      if (newEmail !== currentUser.email) {
        // 检查新邮箱是否已被占用
        const [dup] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, req.user.id]);
        if (dup.length > 0) {
          return res.status(409).json({ message: 'email already in use' });
        }
        emailChanged = true;
      }
    }

    // 构建 UPDATE
    const sets = [];
    const params = [];
    if (newNickname !== undefined) { sets.push('nickname = ?'); params.push(newNickname); }
    if (newBio !== undefined) { sets.push('bio = ?'); params.push(newBio); }
    if (newEmail !== undefined) { sets.push('email = ?'); params.push(newEmail); }
    if (emailChanged) {
      // 邮箱变更需重新验证
      const verify_token = crypto.randomBytes(32).toString('hex');
      const verify_expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      sets.push('is_verified = 0');
      sets.push('verify_token = ?'); params.push(verify_token);
      sets.push('verify_expires = ?'); params.push(verify_expires);
    }
    if (sets.length === 0) {
      return res.json({ message: 'no changes to apply' });
    }
    params.push(req.user.id);
    await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, params);

    // 重新获取用户
    const [updatedRows] = await pool.query(
      'SELECT id, username, nickname, email, bio, avatar, role, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const updatedUser = updatedRows[0];

    // 若邮箱变更，发验证邮件
    if (emailChanged) {
      const [tokenRows] = await pool.query(
        'SELECT verify_token FROM users WHERE id = ?',
        [req.user.id]
      );
      const vt = tokenRows[0]?.verify_token;
      if (vt) {
        try {
          await sendVerificationEmail(newEmail, updatedUser.username, vt);
        } catch (mailErr) {
          console.warn('profile email verification mail error:', mailErr.message);
        }
      }
      return res.json({
        message: 'profile updated — please verify your new email',
        user: updatedUser,
        emailChanged: true,
      });
    }

    res.json({ message: 'profile updated', user: updatedUser });
  } catch (err) {
    console.error('profile update error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

// ====== PUT /api/auth/avatar — 更新头像 ======
router.put('/avatar', authRequired, authNoGuest, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar || typeof avatar !== 'string') {
      return res.status(400).json({ message: 'avatar URL is required' });
    }
    // 路径穿越防护：只允许 /uploads/ 开头的合法路径
    if (!avatar.startsWith('/uploads/') || avatar.includes('..')) {
      return res.status(400).json({ message: 'invalid avatar path' });
    }
    if (avatar.length > 500) {
      return res.status(400).json({ message: 'avatar URL too long' });
    }

    await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.user.id]);
    res.json({ message: 'avatar updated', avatar });
  } catch (err) {
    console.error('avatar update error:', err);
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
