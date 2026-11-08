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

// 案例详情 /work/:slug：标题与摘要来自项目档案，单一真源也在客户端数据文件里
const PROJECTS_MODULE = path.join(__dirname, '../../Client/src/data/projects.js');
const COMPANY_URL = (process.env.COMPANY_URL || 'https://woodwhite.top').replace(/\/+$/, '');
let projectsPromise = null;
function loadProjects() {
  if (!projectsPromise) {
    projectsPromise = import(pathToFileURL(PROJECTS_MODULE).href)
      .then((mod) => mod.projects || [])
      .catch((e) => {
        console.error('[seo] projects 加载失败:', e.message);
        return [];
      });
  }
  return projectsPromise;
}

// 命中返回 meta 对象，slug 不存在返回 null（交给默认页面）
async function caseMeta(pathname) {
  const m = pathname.match(/^\/work\/([^/]+)$/);
  if (!m) return null;
  let slug;
  try { slug = decodeURIComponent(m[1]); } catch (e) { return null; }
  const list = await loadProjects();
  const p = list.find((x) => x.slug === slug);
  if (!p) return null;
  const desc = String(p.summary || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  return {
    title: `${p.name} — 案例 · 木白 woodwhite`,
    description: desc || `${p.name}：${p.subtitle}`,
    canonical: `${COMPANY_URL}/work/${encodeURIComponent(p.slug)}`,
  };
}

// 公司页的社交卡片沿用博客模板的 og:site_name，分享出去显示「woodwhite@blog」，与站点不符
const COMPANY_NAME = '木白 woodwhite';

// 公司站的结构化数据：一个人接单的实体服务，地址/服务区域来自站点文案
const COMPANY_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: COMPANY_NAME,
  alternateName: 'woodwhite',
  url: COMPANY_URL,
  description: '一个人负责的 AI 应用交付：需求、数据、模型、部署与巡检，交付代码、部署脚本、监控与运行手册。',
  areaServed: [
    { '@type': 'City', name: '乐清' },
    { '@type': 'City', name: '温州' },
    { '@type': 'Country', name: '中国' },
  ],
  email: '1903784785@qq.com',
  founder: { '@type': 'Person', name: 'WoodWhite', alternateName: '木白' },
  knowsAbout: ['AI 应用', '向量检索', '本地模型推理', 'Vue 3', 'Node.js', 'PostgreSQL'],
  makesOffer: {
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: 'AI 应用与系统定制开发' },
  },
};

function companyJsonLdTag() {
  return `<script type="application/ld+json">${JSON.stringify(COMPANY_JSON_LD)}<\/script>`;
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
  if (String(meta.canonical || '').startsWith(COMPANY_URL)) {
    out = out.replace(/<meta property="og:site_name" content="[^"]*" \/>/, `<meta property="og:site_name" content="${COMPANY_NAME}" />`);
    // 分享卡换成公司站自己的图（模板里默认是博客的 og-default.jpg）
    const ogImage = `${COMPANY_URL}/og-company.jpg`;
    out = out.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${ogImage}" />`);
    out = out.replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${ogImage}" />`);
    out = out.replace('</head>', `  ${companyJsonLdTag()}\n  </head>`);
  }
  return out;
}

async function renderSeoHtml(req, baseHtml) {
  const ROUTE_META = await loadRouteMetaTable();
  const routeMeta = ROUTE_META[req.path === '' ? '/' : req.path.replace(/\/+$/, '') || '/'];
  if (routeMeta) return applyRouteMeta(baseHtml, routeMeta);

  const caseInfo = await caseMeta(req.path === '' ? '/' : req.path.replace(/\/+$/, '') || '/');
  if (caseInfo) return applyRouteMeta(baseHtml, caseInfo);

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

async function hasRouteMeta(pathname) {
  const table = await loadRouteMetaTable();
  if (Object.prototype.hasOwnProperty.call(table, pathname)) return true;
  return Boolean(await caseMeta(pathname));
}

module.exports = { renderSeoHtml, hasRouteMeta, loadProjects };
