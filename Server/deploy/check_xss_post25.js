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

  // 帖子 #25 全文 + 作者信息
  const [rows] = await conn.query(
    `SELECT p.id, p.title, p.content, p.status, p.post_type, p.author_id,
            p.created_at, p.views, u.username, u.role, u.register_ip
     FROM posts p JOIN users u ON p.author_id = u.id
     WHERE p.id = 25`
  );
  for (const r of rows) {
    console.log('===== 帖子 #25 完整信息 =====');
    console.log('标题:      ' + r.title);
    console.log('状态:      ' + r.status);
    console.log('类型:      ' + r.post_type);
    console.log('作者:      ' + r.username + ' (role=' + r.role + ', id=' + r.author_id + ')');
    console.log('注册IP:    ' + r.register_ip);
    console.log('创建时间:  ' + r.created_at);
    console.log('浏览量:    ' + r.views);
    console.log('\n===== 内容全文 (长度 ' + (r.content||'').length + ') =====');
    console.log(r.content);
    console.log('\n===== 内容中残留的 < > 字符 =====');
    const lt = (r.content||'').match(/</g);
    const gt = (r.content||'').match(/>/g);
    console.log('`<` 数量: ' + (lt ? lt.length : 0) + ', `>` 数量: ' + (gt ? gt.length : 0));
  }

  // 该用户的注册信息和所有帖子
  const [u] = await conn.query(
    `SELECT id, username, email, role, is_verified, register_ip, created_at
     FROM users WHERE id = (SELECT author_id FROM posts WHERE id = 25)`
  );
  if (u.length) {
    console.log('\n===== 作者账户信息 =====');
    console.log(JSON.stringify(u[0], null, 2));
  }

  // 帖子 #25 的评论
  const [c] = await conn.query(
    `SELECT c.id, c.content, c.created_at, u.username, u.register_ip
     FROM comments c JOIN users u ON c.user_id = u.id
     WHERE c.post_id = 25 ORDER BY c.created_at`
  );
  if (c.length) {
    console.log('\n===== 帖子 #25 的评论 =====');
    c.forEach(x => console.log(`  #${x.id} by ${x.username} (注册IP ${x.register_ip}) @ ${x.created_at}: ${x.content.slice(0,300)}`));
  }

  await conn.end();
})();
