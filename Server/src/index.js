const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();
require('./config/logger'); // 激活内存日志捕获（尽早加载）
const { ensureDatabase } = require('./config/db');
const pool = require('./config/db');
const { globalLimiter } = require('./config/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

// ====== 安全中间件（最先加载） ======

// 信任 Caddy 反代传过来的 X-Forwarded-For 等头
app.set('trust proxy', 1);

// Helmet（HTTP 裸跑模式，TLS 由 Caddy 终结）
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],   // 组件内联 style
      imgSrc: ["'self'", 'data:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  strictTransportSecurity: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  originAgentCluster: false,
}));

// CORS — 允许已知前端域名
const allowedOrigins = [
  process.env.SITE_URL || 'http://localhost:5173',
  'https://blog.woodwhite.top',
  'http://blog.woodwhite.top',
  'http://blog.woodwhite.top:3027',
  'http://woodwhite.top:3027',
  'http://woodwhite.top:30827',
  'http://blog.woodwhite.top:30827',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3027',
  'http://localhost:30827',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3027',
  'http://127.0.0.1:30827',
];
app.use(cors({
  origin: (origin, cb) => {
    // 同源或无 origin（服务器间请求）允许
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('CORS blocked: ' + origin));
    }
  },
  credentials: true,
}));

// 请求体大小限制（防大 payload 攻击）
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 全局速率限制
app.use(globalLimiter);

// 静态文件 — 上传目录
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 静态文件 — 前端打包产物（生产环境）
app.use(express.static(path.join(__dirname, '../../Client/dist')));

// ====== API 路由 ======
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

// 标签列表（独立端点，供前端 tag cloud 和 autocomplete）
app.get('/api/tags', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.name, t.slug, COUNT(pt.post_id) AS post_count
       FROM tags t
       LEFT JOIN post_tags pt ON t.id = pt.tag_id
       GROUP BY t.id
       ORDER BY post_count DESC, t.name ASC
       LIMIT 50`
    );
    res.json({ tags: rows });
  } catch (err) {
    console.error('tags error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/posts',  require('./routes/posts'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin',  require('./routes/admin'));

// ====== SEO 路由（feed.xml / sitemap.xml，需在 SPA fallback 之前） ======
app.use(require('./routes/seo'));

// ====== SPA 兜底 + API 404（必须在 API 路由之后） ======
// 非 API 的请求全部返回 index.html，由前端路由处理
app.use((req, res, next) => {
  // API 或静态文件请求 → 404
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ message: 'endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../../Client/dist/index.html'));
});

// ====== 全局错误处理（不泄露堆栈） ======
app.use((err, req, res, next) => {
  console.error('unhandled error:', err.message);
  // 不向客户端暴露内部错误细节
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: 'origin not allowed' });
  }
  res.status(500).json({ message: 'internal server error' });
});

// ====== 启动 ======
async function start() {
  await ensureDatabase();  // 自动检测并创建数据库/表
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
    console.log(`Uploads served at http://127.0.0.1:${PORT}/uploads`);
  });
}
start();
