const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// ====== GET /api/users/:username — 用户主页资料 ======
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const [rows] = await pool.query(
      `SELECT id, username, nickname, bio, avatar, role, is_verified, created_at
       FROM users WHERE username = ?`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'user not found' });
    }

    // 文章计数
    const [countRows] = await pool.query(
      'SELECT COUNT(*) AS post_count FROM posts WHERE author_id = ? AND status = ?',
      [rows[0].id, 'published']
    );
    const post_count = countRows[0]?.post_count ?? 0;

    const user = { ...rows[0], post_count };

    res.json({ user });
  } catch (err) {
    console.error('get user error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

module.exports = router;
