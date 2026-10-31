# woodwhite@blog — 技术论坛

基于 Vue 3 + Express 5 + MySQL 的技术论坛博客。

## 技术栈

- **前端**: Vue 3 (Composition API) + Vue Router 4 + marked + DOMPurify
- **后端**: Express 5 + JWT + bcryptjs + nodemailer
- **数据库**: MySQL 8.0 (mysql2)
- **安全**: Helmet + express-rate-limit + CORS + CSP

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/woodwhite0ets/personal-blog.git
cd personal-blog

# 2. 安装依赖
cd Server && npm install
cd ../Client && npm install

# 3. 配置环境变量
cp Server/.env.example Server/.env
# 编辑 Server/.env，填入你的 MySQL 密码和邮箱配置

# 4. 创建 uploads 目录
mkdir Server/uploads

# 5. 启动后端
cd Server && npm run dev
```

生产环境访问 `http://localhost:3027`，后端直接提供前端 `dist/` 静态文件。

## 服务器部署

```bash
# 拉取最新代码
git pull

# 安装依赖
cd Server && npm install
cd ../Client && npm install && npm run build   # 前端需构建（dist/ 不入库）

# 重启服务（pm2，NODE_ENV=production）
cd ../Server && pm2 restart blog
```

> 注意：`Client/dist/` 已不再提交到仓库（改为部署时构建），因此每次前端有改动后**必须**执行 `Client && npm run build` 再重启。


## 环境变量参考

复制 `Server/.env.example` 为 `Server/.env`，填入实际值：

```env
PORT=3027
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=blog_byown
JWT_SECRET=换成你自己的64位随机字符串
MAIL_HOST=smtp.qq.com
MAIL_PORT=587
MAIL_USER=你的QQ邮箱
MAIL_PASS=SMTP授权码
MAIL_FROM=你的QQ邮箱
SITE_URL=http://localhost:3027
```

## AI 项目榜（每日更新）

`/ai-daily` 页面 + 首页「AI 项目榜」简讯，每天 08:00 自动更新。

- **采集**：`Server/scripts/collect-ai-daily.mjs`（在工作站跑）— GitHub Search API 抓 6 组 AI 相关 topic，合并去重后取 120 个候选；用本地 llama.cpp（`127.0.0.1:8092`，qwen2.5-coder-7b）生成中文一句话，再由 `tightenZh()` 收敛成长度、术语统一的一句话
- **排榜**：`Server/scripts/import-ai-daily.js`（在服务器跑）— 与 `ai_repo_seen` 里上一次的 star 对比算出日增，按「升星榜 8 + 新上榜 4 + 总 star 兜底」排出当日 12 条，幂等可重复导入
- **接口**：`GET /api/ai-daily`（`?date=&limit=`）、`/api/ai-daily/latest?limit=3`（首页简讯）、`/api/ai-daily/dates`
- **定时**：工作站 systemd user timer `ai-daily.timer` → `Server/scripts/run-ai-daily.sh`（采集 → scp → 服务器导入）。单元文件在 `Server/scripts/systemd/`，手工触发：`systemctl --user start ai-daily.service`
- **数据表**：`ai_repo_seen`（观察池，存每个仓库最近 star）、`ai_daily_items`（每日榜单快照），启动时自动 migrate
- **注意**：`DATE` 字段在连接池里配置了 `dateStrings: ['DATE']`，否则 UTC+8 下会被 `toISOString()` 折成前一天
