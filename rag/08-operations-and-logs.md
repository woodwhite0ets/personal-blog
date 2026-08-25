---
title: woodwhite@blog 运维、日志与攻击分析
type: operations
keywords: [部署, Caddy, PM2, 日志, 攻击分析, fail2ban, UFW]
---

# 运维、日志与攻击分析

## 进程和反代

- Node 服务由 PM2 管理，应用名通常为 `blog`。
- Node 监听 `127.0.0.1:3027`。
- Caddy 监听公网 80/443，并反代到 Node。
- MySQL 仅本机监听。

修改后端代码后通常需要上传文件并执行 `pm2 restart blog`。前端修改需要 `npm run build`，然后同步 `Client/dist` 到服务器。

## 后端日志

```text
Server/logs/out.log
Server/logs/err.log
```

后端请求日志包含客户端 IP、方法、路径、状态码和耗时。静态资源以及管理员控制台请求默认会被过滤，避免刷屏。

## Caddy 日志

生产访问日志：

```text
/var/log/caddy/blog-access.log
```

日志为 JSON，包含 client_ip、method、uri、status、duration、User-Agent 和 TLS 信息。日志按大小轮转并压缩保存，查看历史时需要同时检查 `.gz` 轮转文件。

后台日志页面支持后端日志和 Caddy 日志切换；Caddy 日志默认隐藏 `/api/admin/*`，可以通过“显示管理员日志”开关查看。

## 攻击分析工具

项目中有以下脚本：

```text
Server/deploy/analyze_live.js
Server/deploy/analyze_date.js
Server/deploy/summary_attackers.js
Server/deploy/check_xss.js
Server/deploy/check_xss_deep.js
```

用途：

- `analyze_live.js`：分析最近指定分钟的 Web 行为和 SSH 爆破。
- `analyze_date.js`：分析指定日期的敏感文件、WordPress、PHP、认证、管理 API、XSS 和 SQL 注入特征。
- `summary_attackers.js`：按 IP 聚合当天可疑请求。
- `check_xss*.js`：扫描帖子、评论、用户资料、Caddy 日志和错误日志中的 XSS 特征。

分析工具只读，不应因为发现可疑 IP 就自动封禁；是否封禁需要人工确认。

## 蜜罐

Caddy 对 `.env`、`.git`、`.aws`、Caddyfile、docker-compose 和 WordPress 探测路径提供蜜罐响应。蜜罐返回假内容，不包含真实生产凭据。fail2ban/UFW 的部署和封禁操作应谨慎执行，避免误伤合法用户。
