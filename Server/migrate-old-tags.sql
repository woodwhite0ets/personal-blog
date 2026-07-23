-- ====== 迁移旧文章标签 ======
-- 将 posts 表的旧 tag 字段迁移到新的 tags + post_tags 系统
-- 用法：在 MySQL 中打开此文件执行，或在命令行：
--   mysql -u root -p < Server/migrate-old-tags.sql

USE blog_byown;

-- 1. 检查旧 tag 字段是否存在
SHOW COLUMNS FROM posts LIKE 'tag';

-- 2. 为每篇有旧标签的文章创建标签并关联
INSERT IGNORE INTO tags (name, slug)
SELECT DISTINCT
  p.tag AS name,
  LOWER(REPLACE(REPLACE(p.tag, ' ', '-'), '_', '-')) AS slug
FROM posts p
WHERE p.tag IS NOT NULL
  AND p.tag != ''
  AND p.tag != 'uncategorized';

-- 3. 建立文章-标签关联
INSERT IGNORE INTO post_tags (post_id, tag_id)
SELECT p.id, t.id
FROM posts p
JOIN tags t ON t.name = p.tag
WHERE p.tag IS NOT NULL
  AND p.tag != ''
  AND p.tag != 'uncategorized';

-- 4. 验证结果
SELECT t.name, COUNT(pt.post_id) AS post_count
FROM tags t
LEFT JOIN post_tags pt ON t.id = pt.tag_id
GROUP BY t.id
ORDER BY post_count DESC;
