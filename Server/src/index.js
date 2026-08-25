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
      imgSrc: ["'self'", 'data:', 'blob:',
        'https://img.shields.io',           // 技术徽章
        'https://github.com', 'https://*.github.com',      // GitHub 图片/CAMO
        'https://*.githubusercontent.com',  // GitHub user content
        'https://cdn.jsdelivr.net',         // npm/开源 CDN
      ],
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
  'https://woodwhite.top',
  'http://woodwhite.top',
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

// ====== 访问日志（记录客户端 IP / 方法 / 路径 / 状态码，供安全追溯） ======
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // 跳过静态资源 + 管理员控制台操作（assets/uploads 为前端文件批量加载；/api/admin/ 为管理员正常操作）
    if (req.path.startsWith('/uploads/') || req.path.startsWith('/assets/')) return;
    if (req.path.startsWith('/api/admin/')) return;  // 过滤管理员访问控制台的日志
    console.log(`[req] ${req.ip} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

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

// 作者统计（供首页贡献者列表 + 全站已发布文章总数，而非当前分页）
app.get('/api/authors', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.username, u.nickname, u.avatar, COUNT(p.id) AS post_count
       FROM users u
       JOIN posts p ON p.author_id = u.id AND p.status = 'published'
       GROUP BY u.id
       ORDER BY post_count DESC, u.username ASC`
    );
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM posts WHERE status = 'published'`
    );
    res.json({ authors: rows, total_published: totalRows[0]?.total || 0 });
  } catch (err) {
    console.error('authors error:', err);
    res.status(500).json({ message: 'internal server error' });
  }
});

app.use('/api/auth',   require('./routes/auth'));
app.use('/api/posts',  require('./routes/posts'));
app.use('/api/users',  require('./routes/users'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin',  require('./routes/admin'));
app.use('/api/admin/gateway', require('./routes/gatewayAdmin'));

// ====== SEO 路由（feed.xml / sitemap.xml，需在 SPA fallback 之前） ======
app.use(require('./routes/seo'));

// ====== SPA 兜底 + API 404（必须在 API 路由之后） ======
// 非 API 的请求全部返回 index.html，由前端路由处理
app.use((req, res, next) => {
  // API 或静态文件请求 → 404
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return res.status(404).json({ message: 'endpoint not found' });
  }
  // Gateway control-plane paths must never be swallowed by the SPA fallback.
  // The blog Caddy proxies /mcp and /console to the knowledge-base gateway; if a
  // request still reaches Express here it is misrouted and should 404, not return
  // HTML that an MCP client would misread as a successful response.
  if (req.path === '/mcp' || req.path.startsWith('/mcp/') ||
      req.path === '/console' || req.path.startsWith('/console/')) {
    return res.status(404).json({ message: 'endpoint not found' });
  }
  // Missing hashed assets under /assets (e.g. an old entry point referencing a
  // removed chunk) → 404 instead of a misleading 200 text/html.
  if (req.path.startsWith('/assets/')) {
    return res.status(404).json({ message: 'not found' });
  }
  // The SPA entry references hashed assets. Never let browsers keep an old
  // entry point after a deployment, otherwise they can request removed chunks.
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.sendFile(path.join(__dirname, '../../Client/dist/index.html'));
});

// ====== 全局错误处理（不泄露堆栈） ======
app.use((err, req, res, next) => {
  // 客户端畸形请求（URI 解码失败、非法 JSON、请求中断）→ 400，不污染 error 日志
  if (err instanceof URIError) {
    return res.status(400).json({ message: 'bad request' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'invalid JSON body' });
  }
  if (err.type === 'request.aborted') {
    return res.status(400).json({ message: 'request aborted' });
  }
  // CORS
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ message: 'origin not allowed' });
  }
  // 真正的服务端错误才记录并返回 500
  console.error('unhandled error:', err.message);
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
