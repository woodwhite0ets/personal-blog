const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { uploadLimiter } = require('../config/rateLimit');

const router = express.Router();

// ====== Multer 配置 ======
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

// 确保目录存在
['posts', 'avatars'].forEach(dir => {
  const p = path.join(UPLOADS_ROOT, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// 安全：清理文件名，防路径遍历和特殊字符
function sanitizeFilename(filename) {
  // 只保留扩展名，用安全的前缀重建文件名
  const ext = path.extname(filename).toLowerCase();
  // 移除路径遍历字符
  return filename
    .replace(/\.\./g, '')
    .replace(/[\\/:*?"<>|]/g, '_');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'posts'; // cover | content | avatar

    // 安全：验证 type 参数，防止路径遍历
    if (type !== 'avatar' && type !== 'posts' && type !== 'cover') {
      return cb(new Error('invalid upload type'), '');
    }

    let dest;
    if (type === 'avatar') {
      dest = path.join(UPLOADS_ROOT, 'avatars');
    } else {
      // 验证 slug 防路径遍历
      const slug = (req.body.slug || 'unknown').replace(/\.\./g, '').replace(/[\\/:*?"<>|]/g, '_');
      dest = path.join(UPLOADS_ROOT, 'posts', slug);
    }

    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const safeName = sanitizeFilename(file.originalname);
    const ext = path.extname(safeName).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    if (!allowed.includes(ext)) {
      return cb(new Error('unsupported file type'));
    }

    // 封面固定为 cover.ext，其他用时间戳避免冲突
    const prefix = req.body.type === 'cover'
      ? 'cover'
      : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    cb(null, prefix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('only image files are allowed'), false);
    }
  },
});

// ====== POST /api/upload ======
router.post('/', authRequired, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'no file uploaded' });
    }

    const type = req.body.type || 'posts';
    const slug = (req.body.slug || '').replace(/\.\./g, '').replace(/[\\/:*?"<>|]/g, '_');

    // 验证上传权限：非 avatar 上传时检查文章归属
    if (type !== 'avatar') {
      if (!slug || slug === 'unknown') {
        // 清除已上传的文件
        try { fs.unlinkSync(req.file.path); } catch {}
        return res.status(400).json({ message: 'slug is required for post uploads' });
      }
      const [postRows] = await pool.query(
        'SELECT id, author_id FROM posts WHERE slug = ?',
        [slug]
      );
      if (postRows.length === 0) {
        // 新文章允许上传 — slug 是前端生成的临时值
        // 但需要验证 slug 格式（ts + random 格式）
        if (!/^[a-z0-9-]+-[a-z0-9]+$/.test(slug)) {
          try { fs.unlinkSync(req.file.path); } catch {}
          return res.status(400).json({ message: 'invalid slug format' });
        }
      } else {
        // 已有文章：仅允许作者本人或 admin 上传
        if (postRows[0].author_id !== req.user.id && req.user.role !== 'admin') {
          try { fs.unlinkSync(req.file.path); } catch {}
          return res.status(403).json({ message: 'not your post' });
        }
      }
    }

    // 构建访问 URL（相对于 uploads 目录）
    let url;
    if (type === 'avatar') {
      url = `/uploads/avatars/${req.file.filename}`;
    } else {
      url = `/uploads/posts/${slug}/${req.file.filename}`;
    }

    res.json({ url, filename: req.file.filename, size: req.file.size });
  } catch (err) {
    console.error('upload error:', err);
    // 出错时清理已上传文件
    try { if (req.file) fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ message: 'upload failed' });
  }
});

// ====== 错误处理 ======
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'file too large (max 10 MB)' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'only image files are allowed' || err.message === 'unsupported file type') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
