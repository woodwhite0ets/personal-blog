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

生产环境访问 `http://localhost:3027`，后端直接提供前端 dist/ 静态文件。

## 服务器部署

```bash
# 拉取最新代码
git pull

# 安装新依赖（如有）
cd Server && npm install
cd ../Client && npm install

# 重启服务
cd Server && npm run dev
```

每次 `git pull` 后无需重新构建前端（dist/ 已包含在仓库中）。


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
