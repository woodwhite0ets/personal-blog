const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// 站点配置（生产域名）
const SITE_URL = process.env.SITE_URL || 'http://localhost:3027';

// 安全包装 CDATA 内容：转义 ]]> 防止 CDATA 注入
function cdata(text) {
  return String(text || '').replace(/\]\]>/g, ']]]]><![CDATA[>');
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
      const desc = (p.excerpt || p.content || '').slice(0, 300).replace(/<[^>]*>/g, '');
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

// ====== GET /sitemap.xml — sitemap ======
router.get('/sitemap.xml', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT slug, published_at FROM posts WHERE status = 'published'`
    );

    const urls = rows.map(p => {
      const lastmod = p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      return `  <url>
    <loc>${SITE_URL}/post/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
  </url>
  <url>
    <loc>${SITE_URL}/HomePage</loc>
  </url>
  <url>
    <loc>${SITE_URL}/archive</loc>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
  </url>
${urls}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error('sitemap error:', err);
    res.status(500).send('sitemap error');
  }
});

module.exports = router;
