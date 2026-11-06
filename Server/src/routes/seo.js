const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// 站点配置（生产域名）
const SITE_URL = (process.env.SITE_URL || 'http://localhost:3027').replace(/\/+$/, '');
const COMPANY_URL = (process.env.COMPANY_URL || 'https://woodwhite.top').replace(/\/+$/, '');
// 两个域各自只收录自己承载的页面（sitemap 里的 loc 必须与所在域一致）
const isCompanyHost = (host = '') => host === 'woodwhite.top' || host === 'www.woodwhite.top';

// 安全包装 CDATA 内容：转义 ]]> 防止 CDATA 注入
function cdata(text) {
  return String(text || '').replace(/\]\]>/g, ']]]]><![CDATA[>');
}

// Markdown 源码 → 纯文本摘要（RSS/SEO description 用，避免 ## ** 裸露）
function stripMd(src) {
  return String(src || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/!\[[^\]]*\]?/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]{0,3}>[ \t]?/gm, '')
    .replace(/^[ \t]{0,3}[-*+][ \t]+/gm, '')
    .replace(/^[ \t]{0,3}\d+[.)][ \t]+/gm, '')
    .replace(/(\*{1,3})([^*]+)\1/g, '$2')
    .replace(/(_{1,3})([^_]+)\1/g, '$2')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/[ \t]*\|[ \t]*/g, ' ')
    .replace(/(^|\s)[#*_~`]+(?=\s|$)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

// ====== GET /feed.xml — RSS 2.0 ======
router.get('/feed.xml', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.title, p.slug, p.excerpt, p.content, p.published_at, u.username
       FROM posts p JOIN users u ON p.author_id = u.id
       WHERE p.status = 'published'
       ORDER BY p.published_at DESC
       LIMIT 20`
    );

    const items = rows.map(p => {
      const link = `${SITE_URL}/post/${p.slug}`;
      const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : new Date().toUTCString();
      const desc = stripMd(p.excerpt || p.content || '').slice(0, 300);
      return `    <item>
      <title><![CDATA[${cdata(p.title)}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${cdata(p.username)}]]></dc:creator>
      <description><![CDATA[${cdata(desc)}]]></description>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>woodwhite@blog</title>
    <link>${SITE_URL}</link>
    <description>a technical forum blog</description>
    <language>zh-CN</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error('feed error:', err);
    res.status(500).send('feed error');
  }
});

// ====== GET /sitemap.xml — 按域名给各自的 sitemap ======
function sitemapXml(entries) {
  const body = entries.map((e) => `  <url>
    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    if (isCompanyHost(req.hostname)) {
      // 公司站只有四个页面，且都不会被 SPA 二次跳转
      const entries = ['/', '/work', '/stack', '/contact'].map((p) => ({ loc: COMPANY_URL + p }));
      res.set('Content-Type', 'application/xml; charset=utf-8');
      return res.send(sitemapXml(entries));
    }
    const [rows] = await pool.query(
      `SELECT slug, published_at FROM posts WHERE status = 'published'`
    );
    const entries = ['/blog', '/archive', '/about', '/projects', '/tools', '/ai-daily']
      .map((p) => ({ loc: SITE_URL + p }))
      .concat(rows.map((p) => ({
        loc: `${SITE_URL}/post/${p.slug}`,
        lastmod: p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      })));
    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(sitemapXml(entries));
  } catch (err) {
    console.error('sitemap error:', err);
    res.status(500).send('sitemap error');
  }
});

// ====== GET /robots.txt — 每个域指向自己的 sitemap ======
router.get('/robots.txt', (req, res) => {
  const company = isCompanyHost(req.hostname);
  const base = company ? COMPANY_URL : SITE_URL;
  const body = company
    ? `# ${base}/robots.txt
User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`
    : `# ${base}/robots.txt
User-agent: Baiduspider
Disallow: /api/
Disallow: /admin/
Disallow: /editor
Crawl-delay: 3

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /editor

Sitemap: ${base}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(body);
});

module.exports = router;
