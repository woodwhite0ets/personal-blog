const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'blog_byown';

// ====== 自动建库建表 ======
async function ensureDatabase() {
  const initConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
  });

  // 检查数据库是否存在（避免最小权限账号需要全局 CREATE 权限）
  const [dbRows] = await initConn.query(
    'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
    [DB_NAME]
  );
  if (dbRows.length === 0) {
    await initConn.query(
      `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`[db] database "${DB_NAME}" created`);
  } else {
    console.log(`[db] database "${DB_NAME}" ready`);
  }

  await initConn.query(`USE \`${DB_NAME}\``);

  // 检查表是否存在
  const [tables] = await initConn.query('SHOW TABLES');
  if (tables.length > 0) {
    console.log(`[db] ${tables.length} tables already exist`);
    // 运行增量迁移
    await runMigrations(initConn);
    await initConn.end();
    return;
  }

  console.log('[db] creating tables...');

  // 1. users
  await initConn.query(`
    CREATE TABLE \`users\` (
      \`id\`              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
      \`username\`        VARCHAR(20)       NOT NULL,
      \`nickname\`        VARCHAR(50)       NOT NULL,
      \`email\`           VARCHAR(255)      NOT NULL,
      \`password_hash\`   VARCHAR(255)      NOT NULL                  COMMENT 'bcrypt',
      \`bio\`             VARCHAR(300)      DEFAULT '',
      \`avatar\`          VARCHAR(500)      DEFAULT NULL,
      \`role\`            ENUM('admin','author','reader') NOT NULL DEFAULT 'author',
      \`is_verified\`     TINYINT(1)       NOT NULL DEFAULT 0,
      \`verify_token\`    VARCHAR(64)       DEFAULT NULL,
      \`verify_expires\`  DATETIME          DEFAULT NULL,
      \`created_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_username\` (\`username\`),
      UNIQUE KEY \`uk_email\`    (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 2. posts
  await initConn.query(`
    CREATE TABLE \`posts\` (
      \`id\`              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
      \`title\`           VARCHAR(200)      NOT NULL,
      \`slug\`            VARCHAR(200)      NOT NULL,
      \`excerpt\`         VARCHAR(500)      DEFAULT '',
      \`content\`         LONGTEXT          NOT NULL,
      \`cover_image\`     VARCHAR(500)      DEFAULT NULL,
      \`image_dir\`       VARCHAR(300)      DEFAULT NULL,
      \`status\`          ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
      \`is_pinned\`       TINYINT(1)       NOT NULL DEFAULT 0,
      \`read_time\`       VARCHAR(20)       DEFAULT '',
      \`word_count\`      INT UNSIGNED      DEFAULT 0,
      \`author_id\`       INT UNSIGNED      NOT NULL,
      \`published_at\`    DATETIME          DEFAULT NULL,
      \`created_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_slug\` (\`slug\`),
      KEY \`idx_status\` (\`status\`, \`published_at\` DESC),
      KEY \`idx_pinned\` (\`is_pinned\`, \`published_at\` DESC),
      KEY \`idx_author\` (\`author_id\`),
      CONSTRAINT \`fk_posts_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 3. tags
  await initConn.query(`
    CREATE TABLE \`tags\` (
      \`id\`              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
      \`name\`            VARCHAR(30)       NOT NULL,
      \`slug\`            VARCHAR(30)       NOT NULL,
      \`created_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uk_tag_name\` (\`name\`),
      UNIQUE KEY \`uk_tag_slug\` (\`slug\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 4. post_tags
  await initConn.query(`
    CREATE TABLE \`post_tags\` (
      \`post_id\`         INT UNSIGNED      NOT NULL,
      \`tag_id\`          INT UNSIGNED      NOT NULL,
      PRIMARY KEY (\`post_id\`, \`tag_id\`),
      CONSTRAINT \`fk_pt_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_pt_tag\`  FOREIGN KEY (\`tag_id\`)  REFERENCES \`tags\`(\`id\`)  ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 5. post_likes
  await initConn.query(`
    CREATE TABLE \`post_likes\` (
      \`user_id\`         INT UNSIGNED      NOT NULL,
      \`post_id\`         INT UNSIGNED      NOT NULL,
      \`created_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`user_id\`, \`post_id\`),
      CONSTRAINT \`fk_likes_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_likes_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 6. comments
  await initConn.query(`
    CREATE TABLE \`comments\` (
      \`id\`              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
      \`content\`         TEXT              NOT NULL,
      \`user_id\`         INT UNSIGNED      NOT NULL,
      \`post_id\`         INT UNSIGNED      NOT NULL,
      \`parent_id\`       INT UNSIGNED      DEFAULT NULL,
      \`created_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      KEY \`idx_comments_post\` (\`post_id\`, \`created_at\` ASC),
      KEY \`idx_comments_parent\` (\`parent_id\`),
      CONSTRAINT \`fk_comments_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_comments_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_comments_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`comments\`(\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await initConn.end();
  console.log('[db] tables created successfully');
  console.log('[db] create your admin account via the registration page');
}

// ====== 增量迁移 ======
async function runMigrations(conn) {
  const [tables] = await conn.query('SHOW TABLES');
  const existing = tables.map(t => Object.values(t)[0]);

  // 添加 post_likes 表（如果不存在）
  if (!existing.includes('post_likes')) {
    console.log('[db] migration: creating post_likes table');
    await conn.query(`
      CREATE TABLE \`post_likes\` (
        \`user_id\`         INT UNSIGNED      NOT NULL,
        \`post_id\`         INT UNSIGNED      NOT NULL,
        \`created_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`user_id\`, \`post_id\`),
        CONSTRAINT \`fk_likes_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_likes_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  // 添加 comments 表（如果不存在）
  if (!existing.includes('comments')) {
    console.log('[db] migration: creating comments table');
    await conn.query(`
      CREATE TABLE \`comments\` (
        \`id\`              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
        \`content\`         TEXT              NOT NULL,
        \`user_id\`         INT UNSIGNED      NOT NULL,
        \`post_id\`         INT UNSIGNED      NOT NULL,
        \`parent_id\`       INT UNSIGNED      DEFAULT NULL,
        \`created_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`      DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_comments_post\` (\`post_id\`, \`created_at\` ASC),
        KEY \`idx_comments_parent\` (\`parent_id\`),
        CONSTRAINT \`fk_comments_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_comments_post\` FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_comments_parent\` FOREIGN KEY (\`parent_id\`) REFERENCES \`comments\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  // 为现有表添加新列（检查列是否存在）
  const [userCols] = await conn.query('SHOW COLUMNS FROM `users`');
  const userColNames = userCols.map(c => c.Field);
  if (!userColNames.includes('reset_token')) {
    console.log('[db] migration: adding users.reset_token');
    await conn.query('ALTER TABLE `users` ADD COLUMN `reset_token` VARCHAR(64) DEFAULT NULL');
  }
  if (!userColNames.includes('reset_expires')) {
    console.log('[db] migration: adding users.reset_expires');
    await conn.query('ALTER TABLE `users` ADD COLUMN `reset_expires` DATETIME DEFAULT NULL');
  }

  const [postCols] = await conn.query('SHOW COLUMNS FROM `posts`');
  const postColNames = postCols.map(c => c.Field);
  if (!postColNames.includes('views')) {
    console.log('[db] migration: adding posts.views');
    await conn.query('ALTER TABLE `posts` ADD COLUMN `views` INT UNSIGNED NOT NULL DEFAULT 0');
  }
}

// ====== 创建连接池 ======
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

module.exports = pool;

// 对外暴露自动建库函数
module.exports.ensureDatabase = ensureDatabase;
