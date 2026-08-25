---
title: woodwhite@blog 认证、注册与游客身份
type: authentication
keywords: [JWT, bcrypt, 注册, 登录, 游客, 验证码, 邮箱验证]
---

# 认证、注册与游客身份

## 登录

登录接口：

```http
POST /api/auth/login
Content-Type: application/json
```

登录成功后返回 JWT。JWT 使用 HS256，默认有效期为 7 天。Token 载荷包含用户 id、username 和 role。服务端每次认证都会查询数据库刷新实时角色：用户被降权、删除后，旧 Token 不会继续拥有原权限。

密码使用 bcryptjs，cost factor 为 12。密码至少 8 位，必须同时包含字母和数字，最长 128 位。

未验证邮箱的用户不能正常登录。用户名或密码错误统一返回模糊错误，避免枚举。

## 注册

接口：

```http
POST /api/auth/register
```

必须提交 username、nickname、email、password、captcha_id 和 captcha_text。

用户名规则：3-20 位字母、数字或下划线。以下保留用户名不允许注册：

```text
admin
administrator
root
sysadmin
superuser
superadmin
system
```

判断不区分大小写，例如 `Admin` 和 `ADMIN` 也会被拒绝。

## 图形验证码

验证码接口：

```http
GET /api/auth/captcha
```

验证码特点：

- 4 位字符
- 5 分钟过期
- 单次使用，无论验证成功或失败都会删除
- 排除易混淆字符 `0/O`、`1/I/L`
- 有内存数量上限，避免无限增长

## 邮箱验证

注册成功后生成 `crypto.randomBytes(32)` 的验证 Token，有效期 24 小时。用户点击邮件链接后，服务端验证 Token 和过期时间，成功后设置 `is_verified=1` 并清除 Token。

## 游客

游客登录接口仍然存在，前端登录页提供“以游客身份浏览”按钮。游客 Token 使用 sessionStorage，关闭浏览器后失效。公开阅读不要求游客 Token；评论、点赞和发帖必须切换为真实账号登录。

游客接口有独立限流，当前约为每 IP 每分钟 30 次，防止正常访客因刷新页面轻易触发 429。

## 权限中间件

- `authRequired`：要求有效 JWT
- `authOptional`：有 Token 则解析，无 Token 也允许继续
- `authNoGuest`：排除游客身份
- `authAdmin`：要求数据库实时角色为 admin
