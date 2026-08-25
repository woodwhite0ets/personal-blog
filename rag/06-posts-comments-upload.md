---
title: woodwhite@blog 文章、评论、点赞与上传
type: features
keywords: [发帖, 评论, 点赞, 上传, 图片, 编辑器, 论坛]
---

# 文章、评论、点赞与上传

## 文章列表

```http
GET /api/posts
```

支持 `status`、`type`、`author`、`tag`、`search`、`sort` 和分页参数。搜索会转义 LIKE 通配符，排序只接受已知分支，数据库查询使用参数化。

## 发帖

```http
POST /api/posts
Authorization: Bearer <token>
```

服务端从 Token 读取 author_id，不信任客户端提交的作者 ID。普通作者发布内容强制为 forum，只有管理员可以创建或修改博客类型内容。

发帖要求真实账号登录，游客和未登录用户会被拒绝。

## 评论和回复

```http
POST /api/posts/:slug/comments
Authorization: Bearer <token>
```

评论最大长度 2000。服务端会删除 HTML 标签、控制字符和空内容。回复使用 `parent_id`，并校验父评论属于同一篇文章，防止跨文章挂接。

未登录用户在文章页看到“登录后即可发表评论”。

## 点赞

```http
POST /api/posts/:slug/like
Authorization: Bearer <token>
```

服务端从 Token 获取 user_id，使用数据库原子切换避免重复点赞。游客不能点赞；未登录用户点击点赞会跳转 `/login`。

## 图片上传

```http
POST /api/upload
Authorization: Bearer <token>
```

允许的 type：`avatar`、`posts`、`cover`、`content`。`content` 用于兼容旧版编辑器。

允许的图片扩展名和 MIME：JPEG、PNG、GIF、WebP。单文件最大 10MB。服务端还检查真实文件魔数：

- JPEG：`FFD8FF`
- PNG：`89504E470D0A1A0A`
- GIF：`GIF8`
- WebP：`RIFF....WEBP`

上传失败会清理临时文件。头像和文章图片都需要真实用户权限，已有文章的图片只能由作者或管理员上传。

如果旧版编辑器发送 `type=content`，当前后端已兼容；`invalid upload type` 会返回 400，而不是错误地返回 500。
