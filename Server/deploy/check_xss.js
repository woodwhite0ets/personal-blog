require('dotenv').config({path:'/home/ubuntu/personal-blog/Server/.env'});
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // 检查 posts 中的 XSS 注入
  const xssPatterns = [
    '%<script%', '%javascript:%', '%onerror=%', '%onload=%',
    '%<iframe%', '%<embed%', '%<object%', '%<svg %', '%<img %',
    '%onclick=%', '%onfocus=%', '%onmouseover=%', '%expression(%',
    '%<link%', '%<meta%', '%<base%', '%vbscript:%', '%data:text/html%'
  ];

  for (const pattern of xssPatterns) {
    const [rows] = await conn.query(
      'SELECT id, title, status, author_id, created_at FROM posts WHERE content LIKE ? LIMIT 10',
      [pattern]
    );
    if (rows.length > 0) {
      console.log('XSS pattern [' + pattern + ']: ' + rows.length + ' posts');
      rows.forEach(r => console.log('  id=' + r.id + ' title=' + r.title + ' status=' + r.status));
    }
  }

  // 检查 comments
  for (const pattern of xssPatterns) {
    const [rows] = await conn.query(
      'SELECT c.id, c.content, c.created_at, u.username FROM comments c JOIN users u ON c.user_id=u.id WHERE c.content LIKE ? LIMIT 10',
      [pattern]
    );
    if (rows.length > 0) {
      console.log('COMMENT XSS [' + pattern + ']: ' + rows.length);
      rows.forEach(r => console.log('  id=' + r.id + ' user=' + r.username + ' content=' + r.content.slice(0,150)));
    }
  }

  // 检查 users bio
  for (const pattern of xssPatterns.slice(0, 5)) {
    const [rows] = await conn.query(
      'SELECT id, username, bio FROM users WHERE bio LIKE ? LIMIT 10',
      [pattern]
    );
    if (rows.length > 0) {
      console.log('BIO XSS [' + pattern + ']: ' + rows.length);
      rows.forEach(r => console.log('  id=' + r.id + ' user=' + r.username + ' bio=' + r.bio.slice(0,150)));
    }
  }

  // 也查 Caddy 访问日志中是否有 POST 可疑内容的记录
  console.log('\n--- Caddy 日志中疑似 XSS POST 请求 ---');
  const fs = require('fs');
  const logFile = '/var/log/caddy/blog-access.log';
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    const xssLines = [];
    for (const line of lines) {
      if (line.includes('<script') || line.includes('javascript:') || line.includes('onerror=')) {
        xssLines.push(line);
      }
    }
    console.log('日志中 XSS 嫌疑行数: ' + xssLines.length);
    xssLines.slice(0, 10).forEach(l => {
      try {
        const j = JSON.parse(l);
        console.log('  [' + new Date(j.ts*1000).toISOString() + '] ' + j.request.client_ip + ' ' + j.request.method + ' ' + j.request.uri);
      } catch(e) {}
    });
  }

  // 查服务器 error log 中的 XSS 拦截记录
  console.log('\n--- 服务器错误日志 (XSS 被拦截的) ---');
  const errLog = '/home/ubuntu/personal-blog/Server/logs/err.log';
  if (fs.existsSync(errLog)) {
    const errLines = fs.readFileSync(errLog, 'utf8').split('\n').filter(l => l.toLowerCase().includes('xss') || l.toLowerCase().includes('script') || l.toLowerCase().includes('sanitize'));
    console.log('相关错误: ' + errLines.length + ' 条');
    errLines.slice(0, 5).forEach(l => console.log('  ' + l.slice(0, 200)));
  }

  await conn.end();
  console.log('\nDone.');
})();
