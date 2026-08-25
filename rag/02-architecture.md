---
title: woodwhite@blog 技术架构与项目结构
type: architecture
keywords: [Vue 3, Express, MySQL, Caddy, JWT, Vite, 架构]
---

# 技术架构与项目结构

## 请求链路

```text
浏览器
  ↓ HTTPS
Caddy 反向代理
  ↓
127.0.0.1:3027
  ↓
Express 5 后端
  ↓
MySQL
```

Node 后端只监听 `127.0.0.1:3027`，MySQL 只监听本机地址，不直接暴露到公网。公网主要提供 HTTP/HTTPS，SSH 用于运维管理。

## 前端技术

- Vue 3 Composition API
- Vue Router 4
- Vite 构建
- 原生 `fetch` 请求 API
- marked 解析 Markdown
- highlight.js 代码高亮
- DOMPurify 清理 Markdown 生成的 HTML

前端主要目录：

```text
Client/src/
├── components/Login/       登录、注册、验证、找回密码
├── components/Homepage/    首页、论坛、归档、关于
├── components/Post/        文章详情和评论
├── components/Editor/      发帖和编辑器
├── components/User/        用户主页和资料
├── components/Admin/       管理后台
├── router/                 路由和权限守卫
├── stores/                 auth 状态管理
└── utils/                  Markdown 和通用工具
```

## 后端技术

- Node.js
- Express 5
- mysql2/promise
- JWT + HS256
- bcryptjs
- Nodemailer SMTP
- multer 文件上传
- helmet 安全响应头
- cors 跨域白名单
- express-rate-limit 限流

后端主要目录：

```text
Server/src/
├── config/db.js             数据库连接和迁移
├── config/mail.js           SMTP 和邮件模板
├── config/rateLimit.js      全局、登录、注册、邮件限流
├── config/captcha.js        一次性图形验证码
├── config/logger.js         日志
├── config/wordFilter.js     违禁词
├── middleware/auth.js       JWT、游客、管理员权限
└── routes/                  auth、posts、users、upload、admin、seo
```

## 关键生产配置

- 站点地址：`https://blog.woodwhite.top`
- 后端端口：`127.0.0.1:3027`
- Caddy 终结 TLS，并记录 JSON 访问日志
- Node 使用 Helmet CSP、CORS 白名单和请求体大小限制
