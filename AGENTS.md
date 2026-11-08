<!-- proj:auto -->
# blog

## 当前状态（截至 2026-11-07）

静态博客（Vue 客户端 → Express:3027 出 dist），域名 woodwhite.top / blog.woodwhite.top；部署：本地 npm run build → rsync 到 blog:~/personal-blog/Client/dist → pm2 restart blog

- 技术栈：node
- 关联服务：ai-daily, blog-derived
- 仓库：https://github.com/woodwhite0ets/personal-blog.git

## 约定

- 知识条目写 `/data/kb/claims/blog/`，别写进项目目录
- 会话由 `ai` 索引，不需要手动归档
- 长期不做了跑 `proj freeze blog`
