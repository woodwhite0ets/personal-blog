# woodwhite@blog — 技术论坛

基于 Vue 3 + Express 5 + MySQL 的技术论坛博客。

## 技术栈

- **前端**: Vue 3 (Composition API) + Vue Router 4 + marked + DOMPurify
- **后端**: Express 5 + JWT + bcryptjs + nodemailer
- **数据库**: MySQL 8.0 (mysql2)
- **安全**: Helmet + express-rate-limit + CORS + CSP

## 快速开始

1. 安装依赖：
```bash
cd Server && npm install
cd ../Client && npm install
```

2. 配置 `.env`（参考下方）

3. 启动：
```bash
cd Server && npm run dev    # 后端 (默认 :3027)
cd Client && npm run dev    # 前端 (默认 :5173)
```

4. 构建前端：
```bash
cd Client && npm run build
```

## 功能

- Markdown 文章编辑与发布
- 邮箱验证注册 + 游客只读模式
- 用户主页 + 文章归档
- 管理员面板：数据统计、文章管理、用户管理、日志查看
- 标签聚合、作者筛选、置顶文章
- 终端风格 UI（JetBrains Mono）

## 环境变量

复制 `Server/.env.example` 为 `Server/.env`：

```env
PORT=3027
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=blog_byown
JWT_SECRET=your_64_char_random_secret
MAIL_HOST=smtp.qq.com
MAIL_PORT=587
MAIL_USER=your_email@qq.com
MAIL_PASS=your_smtp_auth_code
MAIL_FROM=your_email@qq.com
SITE_URL=http://localhost:3027
```

## 默认管理员

首次启动自动创建：
- 用户名: `WoodWhite`
- 密码: `123456`

⚠️ 上线后请立即修改。
