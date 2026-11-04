const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

const SITE_URL = (process.env.SITE_URL || 'https://blog.woodwhite.top').replace(/\/+$/, '');
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function postOgImage(post) {
  if (post.cover_image && post.cover_image.startsWith('/')) return SITE_URL + post.cover_image;
  if (post.image_dir) {
    const dir = path.join(__dirname, '../../', post.image_dir);
    try {
      const file = fs.readdirSync(dir).find((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));
      if (file) return SITE_URL + post.image_dir.replace(/\/?$/, '/') + file;
    } catch (e) { /* ignore */ }
  }
  return DEFAULT_OG_IMAGE;
}

// 路由 → 独立 meta（公司页、工具库、案例、榜单）。不在这里的路径保持默认。
const ROUTE_META = {
  '/': {
    title: '木白 woodwhite — 协助你做出期待的产品',
    desc: '一个人做，从需求到上线：AI 应用的后端与检索、本地推理与自动化、全栈实现。可开票，按合同交付。',
    canonical: 'https://woodwhite.top/',
  },
  '/projects': {
    title: '案例 — 木白 woodwhite',
    desc: '五个已上线的项目：充电桩检定监管平台、自建 AI 工作站、AI 每日榜、知识库、本站，每条写清问题、做法与结果。',
    canonical: 'https://woodwhite.top/projects',
  },
  '/tools': {
    title: 'AI 工具库 — 木白 woodwhite',
    desc: '按用途收录的 AI 工具，按分类、免费与否、是否需要自备 key 筛选，560 条持续更新。',
    canonical: 'https://blog.woodwhite.top/tools',
  },
  '/ai-daily': {
    title: 'AI 项目榜 — 每日 Star 增量榜',
    desc: '每天从 GitHub 抓取 AI 相关项目，按 24 小时 Star 增量排名，中文介绍由本地模型生成。',
    canonical: 'https://blog.woodwhite.top/ai-daily',
  },
};

function applyRouteMeta(html, meta) {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.desc);
  let out = html;
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`);
  out = out.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`);
  out = out.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`);
  out = out.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`);
  out = out.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${t}" />`);
  out = out.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${d}" />`);
  out = out.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${meta.canonical}" />`);
  out = out.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${meta.canonical}" />`);
  return out;
}

async function renderSeoHtml(req, baseHtml) {
  const routeMeta = ROUTE_META[req.path === '' ? '/' : req.path.replace(/\/+$/, '') || '/'];
  if (routeMeta) return applyRouteMeta(baseHtml, routeMeta);

  const m = req.path.match(/^\/post\/([^/]+)\/?$/);
  if (!m) return baseHtml;
  let post;
  try {
    const [rows] = await pool.query(
      `SELECT p.title, p.slug, p.excerpt, p.cover_image, p.image_dir, p.published_at, u.nickname, u.username
       FROM posts p LEFT JOIN users u ON p.author_id = u.id
       WHERE p.slug = ? AND p.status = 'published' LIMIT 1`, [decodeURIComponent(m[1])]
    );
    post = rows[0];
  } catch (e) {
    return baseHtml;
  }
  if (!post) return baseHtml;
  const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const t = escapeHtml(clean(post.title));
  const d = escapeHtml(clean(post.excerpt).slice(0, 160));
  const canonical = `${SITE_URL}/post/${escapeHtml(post.slug)}`;
  const image = postOgImage(post);
  const ogBody = `<meta property="og:image" content="${image}" />\n    <meta name="twitter:image" content="${image}" />`;
  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${t} — woodwhite@blog</title>`);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${d}" />`);
  html = html.replace(/<meta property="og:type" content="[^"]*" \/>/, '<meta property="og:type" content="article" />');
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${t}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${d}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(/<meta name="twitter:card" content="[^"]*" \/>/, '<meta name="twitter:card" content="summary_large_image" />');
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${t}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${d}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonical}" />\n    ${ogBody}`);
  return html;
}

module.exports = { renderSeoHtml };
