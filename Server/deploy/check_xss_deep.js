require('dotenv').config({path:'/home/ubuntu/personal-blog/Server/.env'});
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('===== 1. 数据库深度扫描（含大小写/编码变体）=====');
  const patterns = [
    '%script%', '%<scr%', '%</scr%', '%iframe%', '%<img%', '%<svg%',
    '%onerror%', '%onload%', '%onclick%', '%javascript%', '%alert(%',
    '%<a %', '%href%', '%<style%', '%expression%', '%<math%', '%<video%',
    '%<audio%', '%<form%', '%<input%', '%<button%', '%<textarea%',
    '%fetch(%', '%XMLHttpRequest%', '%eval(%', '%document.cookie%',
    '%window.location%', '%\\u003c%', '%\\\\u003c%', '%&#60%', '%&#x3c%',
    '%3Cscript%', '%3cscript%'
  ];

  // 先看看全部帖子数量，做整体统计
  const [allPosts] = await conn.query('SELECT COUNT(*) AS n FROM posts');
  const [allComments] = await conn.query('SELECT COUNT(*) AS n FROM comments');
  const [allUsers] = await conn.query('SELECT COUNT(*) AS n FROM users');
  console.log(`帖子总数: ${allPosts[0].n}, 评论总数: ${allComments[0].n}, 用户总数: ${allUsers[0].n}`);

  let postHits = 0, commentHits = 0, bioHits = 0, usernameHits = 0;
  const postDetail = [], commentDetail = [], userDetail = [];

  for (const p of patterns) {
    let [rows] = await conn.query(
      `SELECT id, title, content, status, author_id, post_type, created_at
       FROM posts WHERE content LIKE ? OR title LIKE ? LIMIT 20`,
      [p, p]
    );
    for (const r of rows) {
      if (!postDetail.some(x => x.id === r.id)) {
        postDetail.push(r);
        console.log(`⚠️  帖子 #${r.id} [${r.status}] type=${r.post_type} 标题="${r.title}" 匹配模式 ${p}`);
      }
    }
    postHits += rows.length;

    [rows] = await conn.query(
      `SELECT c.id, c.content, c.created_at, u.username
       FROM comments c JOIN users u ON c.user_id=u.id
       WHERE c.content LIKE ? LIMIT 20`,
      [p]
    );
    for (const r of rows) {
      if (!commentDetail.some(x => x.id === r.id)) {
        commentDetail.push(r);
        console.log(`⚠️  评论 #${r.id} by ${r.username}: ${r.content.slice(0, 200)}`);
      }
    }
    commentHits += rows.length;

    [rows] = await conn.query(
      `SELECT id, username, bio FROM users WHERE bio LIKE ? OR username LIKE ? LIMIT 20`,
      [p, p]
    );
    for (const r of rows) {
      if (!userDetail.some(x => x.id === r.id)) {
        userDetail.push(r);
        console.log(`⚠️  用户 #${r.id} "${r.username}" bio: ${(r.bio||'').slice(0, 200)}`);
      }
    }
    bioHits += rows.length;
  }
  console.log(`\n去重后: 帖子 ${postDetail.length}, 评论 ${commentDetail.length}, 用户 ${userDetail.length}`);

  // 统计含 HTML 标签的帖子（可能是被清理过的残留）
  const [htmlPosts] = await conn.query(
    "SELECT id, title, status, created_at FROM posts WHERE content LIKE '%<%' AND content LIKE '%>%' LIMIT 30"
  );
  console.log(`\n含 < > 尖括号的帖子: ${htmlPosts.length} 篇`);
  htmlPosts.slice(0, 15).forEach(r =>
    console.log(`  #${r.id} [${r.status}] ${r.title} @ ${r.created_at}`));

  console.log('\n===== 2. 后端日志中 POST 发帖请求 =====');
  const outLog = '/home/ubuntu/personal-blog/Server/logs/out.log';
  if (fs.existsSync(outLog)) {
    const lines = fs.readFileSync(outLog, 'utf8').split('\n');
    const posts = lines.filter(l => l.includes('POST') && (l.includes('/api/posts') || l.includes('/api/comments')));
    console.log(`out.log 中 POST /api/posts|/api/comments 请求: ${posts.length} 条`);
    posts.slice(-30).forEach(l => console.log('  ' + l.slice(0, 300)));
  }

  console.log('\n===== 3. Caddy 日志中 POST /api/posts|/api/comments 请求 =====');
  const caddyLog = '/var/log/caddy/blog-access.log';
  if (fs.existsSync(caddyLog)) {
    const lines = fs.readFileSync(caddyLog, 'utf8').split('\n').filter(Boolean);
    const postReqs = [];
    for (const line of lines) {
      if (line.includes('"method":"POST"') &&
          (line.includes('/api/posts') || line.includes('/api/comments') ||
           line.includes('/api/auth/register'))) {
        try {
          const j = JSON.parse(line);
          const d = new Date(j.ts * 1000);
          const pad = n => String(n).padStart(2, '0');
          const beijing = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
          postReqs.push(`${beijing} ${j.request.client_ip} ${j.request.method} ${j.request.uri} -> ${j.status}`);
        } catch(e) {}
      }
    }
    console.log(`POST 请求总数: ${postReqs.length} 条`);
    postReqs.slice(-40).forEach(l => console.log('  ' + l));
  }

  await conn.end();
  console.log('\nDone.');
})();
