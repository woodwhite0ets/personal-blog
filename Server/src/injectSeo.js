const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
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

// 路由 → 独立 meta（公司页、工具库、案例、榜单）。表在客户端目录里，前后端共用一份：
// 客户端站内转页也要用同一套 title/canonical（Client/src/utils/seo.js）。
const ROUTE_META_MODULE = path.join(__dirname, '../../Client/src/data/routeMeta.js');
let routeMetaPromise = null;
function loadRouteMetaTable() {
  if (!routeMetaPromise) {
    routeMetaPromise = import(pathToFileURL(ROUTE_META_MODULE).href)
      .then((mod) => mod.ROUTE_META || {})
      .catch((e) => {
        console.error('[seo] routeMeta 加载失败，保持默认 meta:', e.message);
        return {};
      });
  }
  return routeMetaPromise;
}

function applyRouteMeta(html, meta) {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
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
  const ROUTE_META = await loadRouteMetaTable();
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
