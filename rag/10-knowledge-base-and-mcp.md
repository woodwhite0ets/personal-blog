---
title: woodwhite@blog 知识库 / MCP 网关（统一系统）
type: knowledge-base
keywords: [知识库, MCP, 网关, gateway, SSO, 多服务器, /kb, 隧道, mcp]
---

# 知识库 / MCP 网关（统一系统）

## 统一入口

博客和知识库在网页上是一个系统：用户只访问 `https://blog.woodwhite.top`。博客后端、知识库/MCP 网关、其它服务（relay、map）物理分布在不同主机，但都由博客域名作为唯一入口。顶部导航（SiteNav）把「博客」「论坛」「知识库」并列展示，视觉上是一个站点。

## 前端 /kb 页面

- 导航项「知识库」对应路由 `/kb`，组件 `Client/src/components/Kb/KnowledgeBase.vue`（懒加载）。
- 左栏列项目与文档，右栏用 marked + highlight.js + DOMPurify 渲染 Markdown。
- 复用 `SiteNav` / `SiteFooter` / `renderMarkdown`。
- 未登录显示「登录后即可浏览知识库文档」，带 `/login?redirect=/kb` 链接。
- 请求统一经 `Client/src/utils/http.js` 的 `gatewayApi()` / `ensureGatewaySession()` 发起，`credentials:'include'` 携带 Cookie。
- `/api/gateway/projects` 返回**对象数组**（`{ id, owner_id, manageable, documents, chunk_count }`），前端以 `p.id` 渲染项目，并直接用内嵌的 `documents`，避免把项目对象当字符串拼进 URL（旧版误发 `.../%5Bobject%20Object%5D/documents` 导致 `Invalid project` / `Internal server error`）。
- 文档列表按路径**目录分组**：侧栏显示目录标题（如 `learnings`、`rag`）与去掉 `.md` 后转空格的短文件名，避免一长串 md 路径/内容糊满侧栏。
- 点击文档用 `openDocument(d.path)` 拉 `/api/gateway/projects/:id/documents/:path` 渲染正文。

## 网关 API 前缀

前端把 `/api/*` 的网关调用改写为 `/api/gateway/*`（`gatewayPath` 幂等）。例如：

- `/api/me` → `/api/gateway/me`
- `/api/projects` → `/api/gateway/projects`
- `/api/projects/:id/documents` → `/api/gateway/projects/:id/documents`
- `/api/projects/:id/documents/:path` → `/api/gateway/projects/:id/documents/:path`

## SSO（博客账号打通网关）

网关 `src/admin.js` 的 `authenticate()` 支持双通道：

1. 网关自身 `mcp_console_session` Cookie。
2. 博客 RS256 JWT：`src/blogauth.js` 用 `config/blog_jwt_public.pem` 验签，`/api/auth/login`（POST，body `{ token: <blogJwt> }`）完成网关登录。

前端 `ensureGatewaySession()` 先探测 `/api/gateway/me`；若失败且已有博客 JWT，则用 `/api/gateway/auth/login` 自动换取网关会话，因此博客登录态可直达知识库。

## 多服务器拓扑

```text
浏览器
  ↓ HTTPS
博客机 192.144.235.179  Caddy (blog.woodwhite.top)
  ├─ /api/*（博客）        -> 本机 Express 127.0.0.1:3027（PM2 blog）
  ├─ /api/gateway/*        -> 反向 SSH 隧道 127.0.0.1:18081
  └─ /mcp* /healthz /kb    -> 同上（网关控制面）
        ↓ 隧道 mcp-blog-tunnel.service
网关机 183.250.34.149  Docker Compose（gateway + caddy + embeddings + pgvector）
        └─ knowledge/ 卷挂载到容器 /app/knowledge
```

- 博客后端：Express 5 + MySQL，仅监听 `127.0.0.1:3027`，PM2 管理（应用名 `blog`）。
- 网关：Docker Compose，`gateway` 容器 `18080->8080`，提供 MCP 控制面与知识库 API；`embeddings` 负责向量化；`pgvector` 存向量。
- 隧道：systemd 用户服务 `mcp-blog-tunnel.service`，`Restart=always`，从网关机反向 SSH 到博客机 `127.0.0.1:18081`，缓解单点故障。

## 网关机 Caddy（mcp.woodwhite.top）

```text
{$MCP_DOMAIN} {
  tls internal
  encode gzip
  @gateway path /healthz /mcp* /api /api/*
  handle @gateway { reverse_proxy gateway:8080 }
  handle { reverse_proxy https://blog.woodwhite.top { header_up Host blog.woodwhite.top } }
}
```

## 博客机 Caddy 网关代理

`/api/gateway/*` 与 `/mcp*`、`/healthz` 用 `handle_path` / `reverse_proxy https://127.0.0.1:18081`，并把 `Host` 改写为 `mcp.woodwhite.top` 以匹配网关侧站点。`/console` 是 `/gateway` 的 302 别名，实际页面由博客 Vue SPA 提供。

## 知识库文档

网关知识库根目录：`/home/woodwhite/services/mcp-gateway/knowledge/`。项目：

- `projects/blog`（博客系统，含 `architecture.md` 与 `rag/`）
- `projects/relay`、`projects/music`、`projects/knowledge-base`
- `global`（权限/操作说明）、`prompts`、`skills`、`artifacts`、`instructions`、`history`

博客仓库 `rag/`（`/home/ubuntu/personal-blog/rag/`）是博客系统知识的源文档（`00-index.md`~`10-*`），与网关 `projects/blog/rag/` 保持同步；网关侧通过 docker-compose `./knowledge:/app/knowledge` 挂载。

## 更新知识库流程

1. 修改 `/home/ubuntu/personal-blog/rag/` 下文档。
2. 同步到 `/home/woodwhite/services/mcp-gateway/knowledge/projects/blog/rag/`。
3. 在网关管理面「知识库」页点击「重建全部索引」，或调用重建接口让 `embeddings` 重新向量化，RAG 才能检索到新内容。
4. 若改了路由/Caddy，需要 reload caddy 并重启对应服务。

## 相关真相

- 统一入口：`https://blog.woodwhite.top`
- 知识库网页：`/kb`
- 网关/控制面：`/gateway`（博客 SPA 提供的合并控制台）
- 网关健康检查：`/healthz`
- MCP 端点前缀：`/mcp`（经网关机 `mcp.woodwhite.top`）
