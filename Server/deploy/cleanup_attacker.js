// 清理攻击者数据：帖子 #25 (XSS-T1)、帖子 #19 (11111)、tttt 账号 (id=5)
// 先检查所有外键关联，再按顺序删除
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

  const userId = 5;

  // 1. 列出要删的对象，让操作可见
  const [posts] = await conn.query('SELECT id, title, status, post_type, created_at FROM posts WHERE id IN (19,25) OR author_id = ?', [userId]);
  console.log('===== 待删除的帖子 =====');
  posts.forEach(p => console.log(`  #${p.id} [${p.status}] ${p.post_type} "${p.title}" @ ${p.created_at}`));

  const [comments] = await conn.query('SELECT id, post_id, content FROM comments WHERE post_id IN (19,25) OR user_id = ?', [userId]);
  console.log(`待删除的评论: ${comments.length} 条`);
  comments.forEach(c => console.log(`  #${c.id} on post ${c.post_id}: ${c.content.slice(0,100)}`));

  const [user] = await conn.query('SELECT id, username, email, role, is_verified, created_at FROM users WHERE id = ?', [userId]);
  console.log('===== 待删除的账号 =====');
  console.log(' ', JSON.stringify(user[0]));

  // 2. 检查该用户是否有其他关联（likes/favorites 等表）
  const tables = await conn.query('SHOW TABLES');
  const tableNames = tables[0].map(t => Object.values(t)[0]);
  console.log('\n数据库表:', tableNames.join(', '));

  // 3. 按顺序删除：评论 → 帖子 → 用户
  const [r1] = await conn.query('DELETE FROM comments WHERE post_id IN (19,25) OR user_id = ?', [userId]);
  console.log(`\n✅ 删除评论 ${r1.affectedRows} 条`);
  const [r2] = await conn.query('DELETE FROM posts WHERE id IN (19,25) OR author_id = ?', [userId]);
  console.log(`✅ 删除帖子 ${r2.affectedRows} 篇`);
  const [r3] = await conn.query('DELETE FROM users WHERE id = ?', [userId]);
  console.log(`✅ 删除用户 ${r3.affectedRows} 个`);

  // 4. 验证
  const [check1] = await conn.query('SELECT COUNT(*) AS n FROM posts WHERE id IN (19,25) OR author_id = ?', [userId]);
  const [check2] = await conn.query('SELECT COUNT(*) AS n FROM users WHERE id = ?', [userId]);
  const [check3] = await conn.query('SELECT COUNT(*) AS n FROM comments WHERE post_id IN (19,25) OR user_id = ?', [userId]);
  console.log(`\n验证: 帖子残留 ${check1[0].n}, 用户残留 ${check2[0].n}, 评论残留 ${check3[0].n}`);

  await conn.end();
  console.log('清理完成。');
})();
