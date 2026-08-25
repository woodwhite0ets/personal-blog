---
title: woodwhite@blog 忘记密码与邮件验证
type: password-recovery
keywords: [忘记密码, 找回密码, Gmail, SMTP, 邮箱, reset_token]
---

# 忘记密码与邮件验证

## 请求重置密码

接口：

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

请求体：

```json
{"email":"user@example.com"}
```

服务端会生成强随机 `reset_token`，保存到 users 表，并设置 `reset_expires` 为当前时间加 1 小时，然后通过 SMTP 发送重置邮件。

无论邮箱是否存在，都返回相同消息：

```text
if this email is registered, a reset link has been sent
```

这样可以防止攻击者通过接口枚举注册邮箱。

## 执行重置

接口：

```http
POST /api/auth/reset-password
Content-Type: application/json
```

请求体：

```json
{"token":"邮件中的 Token","newPassword":"NewPassword123"}
```

安全规则：

- Token 通过 `crypto.randomBytes(32)` 生成。
- Token 1 小时过期。
- 成功重置后清除 `reset_token` 和 `reset_expires`。
- Token 只能使用一次。
- 新密码经过 bcryptjs 12 轮哈希。
- 新密码至少 8 位，且包含字母和数字。

## 邮件服务

生产邮件使用 Nodemailer + QQ SMTP，站点链接使用：

```text
https://blog.woodwhite.top/reset-password/:token
```

SMTP 配置通过服务器环境变量提供，不应写入知识库或代码仓库。SMTP 正常时后端会记录 `Mail server ready`。

Gmail 用户注册或找回密码时，如果收不到邮件，应检查垃圾邮件、“所有邮件”、邮件过滤器，并确认是否触发限流。

## 邮件防轰炸

邮件接口有三层保护：

1. IP 级：验证邮件重发和忘记密码请求按 IP 限制。
2. 邮箱级：同一邮箱每小时最多约 3 次重置/重发请求，多 IP 轮换也不能无限轰炸同一邮箱。
3. 全局 SMTP 节流：每 60 秒最多发送约 10 封，避免耗尽 SMTP 配额或服务器资源。

如果返回 429，需要等待限流窗口恢复，不应反复刷新。
