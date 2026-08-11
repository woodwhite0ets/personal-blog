require('dotenv').config({path:'/home/ubuntu/personal-blog/Server/.env'});
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  // 1. 该账户的所有动作记录
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [posts] = await conn.query(
    'SELECT id, title, status, post_type, created_at FROM posts WHERE author_id = 5 ORDER BY created_at'
  );
  console.log('===== tttt (id=5) 发的所有帖子 =====');
  posts.forEach(p => console.log(`  #${p.id} [${p.status}] ${p.post_type} "${p.title}" @ ${p.created_at}`));

  const [comments] = await conn.query(
    'SELECT id, post_id, content, created_at FROM comments WHERE user_id = 5 ORDER BY created_at'
  );
  console.log(`tttt 的评论: ${comments.length} 条`);
  comments.forEach(c => console.log(`  #${c.id} on post ${c.post_id}: ${c.content.slice(0,200)}`));

  await conn.end();

  // 2. Caddy 日志中 125.34.17.66 今天 13:28 之后的所有请求
  console.log('\n===== Caddy 日志: 125.34.17.66 今天 13:28 之后的请求 =====');
  const logFile = '/var/log/caddy/blog-access.log';
  if (fs.existsSync(logFile)) {
    const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(Boolean);
    let count = 0;
    for (const line of lines) {
      if (!line.includes('125.34.17.66')) continue;
      try {
        const j = JSON.parse(line);
        if (j.ts < 1722837500) continue; // 2026-08-05 13:58 UTC ~ 21:58 CST? no — just use date
        const d = new Date(j.ts * 1000);
        const pad = n => String(n).padStart(2, '0');
        const beijing = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        console.log(`  ${beijing} ${j.request.method} ${j.request.uri} -> ${j.status}`);
        count++;
      } catch(e) {}
    }
    if (count === 0) console.log('  (无)');
  }
})();
