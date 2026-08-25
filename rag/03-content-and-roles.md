---
title: woodwhite@blog 内容分类与用户角色
type: authorization
keywords: [首页, 论坛, post_type, admin, author, guest, 权限]
---

# 内容分类与用户角色

## 文章类型

数据库文章有 `post_type` 字段，常见值为：

- `blog`：博客文章
- `forum`：论坛帖子

普通作者创建的内容会被服务端限制为 `forum`，不能通过篡改请求体把帖子变成博客首页文章。

## 首页和论坛

首页请求站长文章模式：

```http
GET /api/posts?status=published&type=owner
```

服务端通过作者角色筛选站长文章：

```sql
u.role = 'admin'
```

论坛请求全站已发布内容：

```http
GET /api/posts?status=published
```

论坛包含站长旧文章、站长新文章和其他用户的已发布帖子。站长文章可以同时出现在首页和论坛。

## 用户角色

### 管理员 admin

管理员可以管理所有文章和用户，访问后台统计、日志和用户管理接口，也可以修改文章类型和置顶状态。所有管理员接口统一经过 `authRequired` 和 `authAdmin`。

### 普通作者 author

普通作者可以：

- 浏览公开内容
- 发布论坛帖子
- 编辑和删除自己的帖子
- 评论、回复和点赞
- 修改自己的资料

普通作者不能访问管理员接口、查看其他人的草稿、修改其他人的文章或删除其他人的评论。

### 游客 guest

游客可以浏览公开文章、查看公开评论和公开用户主页。游客不能评论、回复、点赞、发帖、上传、修改资料或访问后台。

## 私密状态

文章状态包括 `published`、`draft` 和 `archived`。

- 未登录用户只能获取 `published`。
- 普通登录用户只能查看自己的 `draft`/`archived`。
- 管理员可以查看全部状态。
- 无权限访问非公开文章时返回 404，避免泄露文章是否存在。
