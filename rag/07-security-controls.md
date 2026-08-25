---
title: woodwhite@blog 安全防护与审计结论
type: security
keywords: [安全, XSS, SQL注入, IDOR, WebShell, CSP, CORS, 上传安全]
---

# 安全防护与审计结论

## XSS 防护

服务端 `sanitizeContent` 会清理 script、iframe、object、embed、事件属性、javascript/vbscript 协议、危险 data 链接和数字字符实体。它可以处理中间混淆形式，例如 `jav&#x61;script:`。

客户端 Markdown 流程是 marked → highlight.js → DOMPurify。文章详情和编辑器预览都经过 DOMPurify。评论使用 Vue 文本插值，不使用 v-html。

## SQL 注入

后端使用 mysql2 参数化查询，用户输入不会直接拼接到 SQL。排序、分页、搜索和筛选参数都有白名单或参数化处理。

## IDOR 和越权

写操作的 user_id、author_id 从服务端认证 Token 获取。编辑/删除文章会校验作者或管理员；删除评论会校验评论作者或管理员；草稿仅对作者和管理员可见；上传文章图片会校验文章归属。

## 上传 WebShell

上传同时检查扩展名、MIME 和文件魔数。只允许图片格式，PHP、HTML、JS、脚本等伪装文件无法通过魔数校验。上传路径会清理路径遍历字符。

## HTTP 防护

Helmet 提供 CSP、X-Content-Type-Options、X-Frame-Options、Referrer-Policy 和 Permissions-Policy。CORS 只允许配置的站点来源。请求体有 1MB 限制，上传有 10MB 限制。

## SSH 与网络

SSH 密码登录已禁用，主要使用密钥认证。fail2ban 监控 SSH 爆破，UFW 可封禁恶意 IP。Node 和 MySQL 仅监听本机地址，Caddy 负责公网 HTTPS 反代。

## 审计结论

已完成的审计曾确认：

- 未发现成功入侵。
- 未发现新增管理员或 WebShell。
- 未发现数据库凭据、JWT 密钥等真实配置泄露。
- 未发现可利用的用户 IDOR 越权。
- 生产依赖通过 npm audit 检查为 0 vulnerabilities。
- XSS 测试评论和 XSS 帖子未执行，随后可按需要清理。
