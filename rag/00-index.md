---
title: woodwhite@blog RAG 知识库索引
type: index
keywords: [博客, 论坛, 知识库, RAG, woodwhite@blog]
---

# woodwhite@blog RAG 知识库

这是 woodwhite@blog 的检索增强生成（RAG）知识库。文档按主题拆分，每个文件可以独立作为一个检索文档块。

## 文档索引

| 文件 | 主题 | 适合回答的问题 |
|---|---|---|
| `01-product-overview.md` | 产品定位与访问体验 | 博客是什么、首页是什么、HR 如何浏览 |
| `02-architecture.md` | 技术架构与目录 | 前后端使用什么技术、请求如何流转 |
| `03-content-and-roles.md` | 内容分类与用户角色 | 首页/论坛区别、谁能发帖、权限是什么 |
| `04-authentication.md` | 登录、注册与邮箱验证 | 如何注册、游客模式、登录为什么失败 |
| `05-password-recovery.md` | 忘记密码与邮件系统 | 如何找回密码、Gmail 收不到邮件怎么办 |
| `06-posts-comments-upload.md` | 文章、评论、点赞与上传 | 如何发帖、评论/点赞规则、上传失败排查 |
| `07-security-controls.md` | 安全防护与审计结论 | 如何防 XSS、SQL 注入、IDOR、WebShell |
| `08-operations-and-logs.md` | 部署、日志与攻击分析 | Caddy 日志在哪里、如何分析攻击 |
| `09-troubleshooting.md` | 常见问题排查 | 登录页、429、发帖失败、邮件失败 |

## 统一事实

- 生产站点：`https://blog.woodwhite.top`
- 根路径 `/`：博客首页，直接展示帖子内容
- 登录页：`/login`
- 论坛：`/forum`
- 后端：Express，生产监听 `127.0.0.1:3027`
- 数据库：MySQL，仅本机监听
- 公开阅读不要求登录；评论、点赞、发帖、上传和后台操作需要相应权限
- 不应在回答中泄露 `.env`、JWT 密钥、SMTP 密码、数据库密码或其他真实凭据
