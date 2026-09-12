---
title: woodwhite@blog 前端 UI 优化与工程化
type: frontend
keywords: [JetBrains Mono, 设计令牌, token, markdown-body, composable, usePosts, useComments, 懒加载, 前端优化, 自托管字体]
---

# 前端 UI 优化与工程化

本文记录 2026-08-31 完成的博客/知识库前端视觉与工程优化。

## 字体：自托管 JetBrains Mono

- 字体自托管在 `Client/public/fonts/`（`jetbrains-mono-400.woff2`、`jetbrains-mono-700.woff2`），不依赖第三方 CDN。
- `Client/index.html` 用 `<link rel="preload" as="font" ... crossorigin>` 预加载，降低 FOUT。
- `Client/src/style.css` 顶部两个 `@font-face`（weight 400/700，`font-display: swap`）。
- CSP `font-src 'self' data:` 允许自托管字体（`Server/src/index.js` Helmet）。
- `--font-mono` 指向 JetBrains Mono；界面默认等宽字体，正文阅读层用 `--font-sans`。

## 设计令牌（Design Tokens）

`Client/src/style.css` 在 `:root` 新增跨主题、与配色解耦令牌：

- 字体：`--font-sans`（比例正文）、`--font-mono`（等宽/代码）。
- 字号：`--fs-2xs`~`--fs-2xl`（14px 基准）。
- 间距：`--sp-1`~`--sp-12`（4px 基准）。
- 圆角：`--radius-sm`~`--radius-full`。

全局 `.btn`、`.btn-sm`、`.btn-icon`、`.tag`、`.field-*` 已改为引用令牌；主题只负责配色，尺寸/间距/圆角由令牌统一。

## 共享 Markdown 排版

`Client/src/style.css` 末尾定义全局 `.markdown-body` 排版（比例字体 16px/1.9，代码层等宽，覆盖 h1-h6/p/a/code/pre/blockquote/img/table/ul/ol/hr/strong），文章详情与知识库正文复用：

- `PostDetail.vue`：模板 `class="post-content markdown-body"`，仅保留 `.post-content` 兜底。
- `KnowledgeBase.vue`：`<article class="kb-article markdown-body">`。

## 数据层 Composable

- `Client/src/composables/usePosts.js`：从 `Homepage.vue` 抽取取数/分页/筛选/搜索/标签/作者统计，含 `fetchSeq` 竞态守卫与 `watch`。
- `Client/src/composables/useComments.js`：从 `PostDetail.vue` 抽取评论加载/发表/回复/删除、权限与 `formatDate`，接收 `{ post, slug }`。

## 路由与构建

- `Client/src/router/index.js` 全部页面用 `() => import(...)` 懒加载，生产按路由分块。
- Vite 输出按路由命名 chunk；`marked`/highlight.js 走独立 `markdown-*.js` chunk，主包更小。

## 统一视觉

博客与知识库共用 `SiteNav`、`SiteFooter`、`ThemeSwitcher` 与主题变量，因此用户在 `https://blog.woodwhite.top` 看到的博客与知识库是同一个站、同一套字体与配色。

## 懒加载、主题持久化与字体现状（已落地）

- **图片懒加载**：`Client/src/utils/markdown.js` 的 `image` renderer 输出 `<img ... loading="lazy" decoding="async">`；`renderMarkdown` 在 DOMPurify 消毒后，再对任何不带 `loading` 的 `<img>` 补 `loading="lazy"`，覆盖 markdown 图片与内嵌 HTML。
- **暗色主题持久化**：`Client/src/stores/theme.js` 用 `blog-theme` localStorage 记住用户选择的主题（terminal/paper/midnight/solar）；`Client/index.html` 的 head 内联脚本在 CSS 渲染前读 `blog-theme` 并设 `data-theme`，避免先亮色再跳变（防 FOUC）。
- **字体现状**：字体已是最小化的自托管 woff2（400/700 各约 21KB，Google Fonts latin 子集），配合 `font-display: swap` + `<link rel="preload" as="font">` + Caddy `zstd/gzip`，无需再越级子集化（过细子集会缺失代码中出现的少数符号字形，收益极小）。

## Gateway 控制台重构：侧栏改顶栏路由 + 知识库管理对齐博客 /kb

`Client/src/components/Gateway/GatewayConsole.vue`（2026-08-31 下午）：

- **侧栏改顶栏路由**：移除左侧 `.sidebar`，改为顶部 `.gateway-tabs`（概览 / 知识库 / 技能 / SSH 服务器 / 审计日志 / 用户与 Token / AI 资产），会话芯片与“退出 Gateway”移到顶栏右侧。
- **知识库管理页对齐博客 `/kb`**：`projects` 视图重写为 `.kb-manager` 左右布局——左栏 `.kb-sidebar`（项目 + 按目录分组的文档列表），右栏 `.kb-content`（终端窗口头 + Markdown 实时预览 / 编辑器）。
- **实时 Markdown 预览**：复用 `utils/markdown.js` 的 `renderMarkdown`，`computed` `renderedDoc` 把文档内容渲染为 `markdown-body`，与博客正文同排版。
- **文档编辑**：`newDoc` / `editCurrentDoc` / `cancelEdit` / `saveDocument` 走知识库文档 API（`/api/gateway/projects/:id/documents`），保存后自动重拉文档列表并预览。
- 构建与生效：`cd Client && npm run build`；`Server/src/index.js` 静态托管 `Client/dist`，无需重启进程即生效。

> 说明：Gateway 控制台需管理员分发 Gateway Token（或博客 SSO）登录后可见；`.gateway-tabs` / `.kb-*` 样式同组件 `<style>` 内。浏览器验证：顶栏 tab 正常、知识库左右布局、文档 Markdown（标题/加粗/列表/引用/代码块）渲染正确。

## 2026-08-31 晚间：移除博客独立知识库 /kb + Gateway 单顶栏

`Client/src`（无需重启进程，`cd Client && npm run build` 即生效）：

- **删除博客独立 `/kb`**：移除 `router/index.js` 的 `/kb` 路由、`common/SiteNav.vue` 的“知识库”导航项（`num: 05`，其余项顺延，Gateway 由 `06` 改 `05`）与 `common/SiteFooter.vue` 的“知识库”页脚链接；删除 `components/Kb/KnowledgeBase.vue` 与空目录。现在 `/kb` 命中路由底部 `/:pathMatch(.*)*` → 重定向到 `/HomePage`。
- **Gateway 单顶栏（不再两层）**：`GatewayConsole.vue` 移除外层 `header.navbar`，把品牌 `[ woodwhite@blog ] ~/gateway`、`.gateway-tabs`（概览/知识库/技能/SSH/审计/用户/AI）与右侧会话（角色/退出）合并进同一个 `header.gateway-header`，`v-if="user"` 控制 tab 是否渲染。样式上 `.gateway-tabs` 去掉独立 `border-bottom`/`margin-bottom`，`flex: 1 1 auto; min-width: 0`，内部 `.gateway-tabs-scroll` 支持 `overflow-x: auto`；`.gateway-header-inner` 用 `flex-wrap: nowrap` 保证单行。
- 知识库管理仍保留在 Gateway 的 `projects` 视图（`kb-manager` 左右布局），博客不再有独立知识库页。

- **Gateway 顶栏精简**：`GatewayConsole.vue` 顶栏移除装饰性 `MCP CONTROL PLANE` 徽标与 `返回博客` 链接（品牌 `[ woodwhite@blog ] ~/gateway` 点击即回 `/HomePage`，作为唯一回博客入口）；登出按钮文案由“退出 Gateway”改为“退出登录”，明确其仅注销网关会话。

- **顶栏/链接防竖排**：`GatewayConsole.vue` 顶栏 `.gateway-tab` 增加 `flex-shrink:0; white-space:nowrap`（tab 不再被压缩导致中文按字符折行竖排，改为横向滚动）、`.nav-link` 与 `.session-chip` 增加 `white-space:nowrap`；`SiteFooter.vue` 的 `.footer-links a` 同样加 `white-space:nowrap`。

- **顶栏简化（去横向滚动）**：`GatewayConsole.vue` 会话芯片移除 `@用户名` 展示（仅保留昵称 + 角色），减少顶栏宽度，避免触发横向滚动。

- **顶栏去横向滚动条**：`GatewayConsole.vue` 压缩顶栏（`.gateway-header-inner` gap 16→10、`.gateway-tabs` gap 16→2、`.gateway-tab` padding/font 缩小、`.nav-actions`/`.gateway-session` gap 8、`.brand` 13px）；并将 `.gateway-tabs-scroll` 的 `overflow-x:auto` 改为 `flex-wrap:wrap`，空间不足时 tab 自动换行，任何宽度都不再出现横向滚动条。

- **Gateway 动画/样式与博客统一**：背景从 CRT 网格+扫描线改为博客 `body::before` 的极光渐变（`.gateway-page` 背景改 transparent，删除 `.bg-grid`/`.bg-scanline`/`gateway-scan`，`gateway-shared.css` 与 `GatewayConsole.vue` 同步）；面板圆角 `8px`→`var(--radius-md)`、`.btn-secondary` 用博客 token；本地 `anim-fade/kbFade` 删除，改用博客全局 `fadeIn`；主内容/登录面板加 `anim-fade-up` 入场；gateway tab 下划线改用博客同款 `::after scaleX` 动画；`GatewayGuide.vue` 移除装饰性 `MCP DOCUMENTATION` 徽标与多余背景层。

## 2026-08-31 弹窗定位修复：入场动画残留 transform 破坏 fixed 定位

`Client/src/style.css` + `Client/src/components/Gateway/GatewayConsole.vue`（无需重启进程，`cd Client && npm run build` 即生效）：

- **现象**：Gateway 会话详情等 `position: fixed` 弹窗出现在“整个长容器”的中间，而不是视口中央。
- **根因**：全局入场动画工具类（`.anim-fade-up` / `.anim-fade` / `.anim-scale` / `.anim-slide-right` / `.anim-stagger`）使用 `animation-fill-mode: both`（等值 `forwards`），动画结束后**保留** `to` 关键帧的 `transform: translateY(0)`。`translateY(0)` 视觉上虽不动，但仍是**非 `none` 的 transform，会为该元素创建 containing block**，使其内部所有 `position: fixed` 后代改为相对该元素（这里就是 Gateway 的 `main.main-layout` 这个长容器）定位，而非视口。
- **修复 A（全局 keyframes）**：把所有入场动画关键帧 `@keyframes fadeInUp / scaleIn / slideInRight / staggerIn / bounceIn / popIn / modalPop / lineGrow` 的 `to`（末帧）改为 `transform: none`（`none` 不创建 containing block；`scale(1)`、`translateY(0)` 等虽视觉为零但仍会创建 containing block）；入场工具类 `animation-fill-mode` 由 `both` 改为 `backwards`（也满足“回弹到自然状态”的需求，且不残留任何 transform）。
- **修复 B（弹窗 Teleport）**：`GatewayConsole.vue` 的会话详情弹窗（`convDetail`，`.modal-overlay`）用 `<Teleport to="body">` 挂到 `<body>`，彻底摆脱任何祖先 transform / backdrop-filter / 定位容器的影响，与 `Admin/ConfirmModal.vue` 的写法保持一致。
- **验证**：`cd Client && npm run build` 通过；dist CSS 中 `.anim-fade-up{animation:.5s backwards fadeInUp}`、`@keyframes fadeInUp{...to{opacity:1;transform:none}}` 均确认；`Server/src/index.js` 静态托管 `Client/dist`，无需重启进程。

## 2026-08-31 深夜：GitHub 导入/技能编辑/SSH 表单改为 Teleport 弹窗

`Client/src/components/Gateway/GatewayConsole.vue`（无需重启进程，`cd Client && npm run build` 即生效）：

- **背景**：此前「GitHub 导入技能」「新建/编辑技能」「新建/编辑 SSH 服务器」在 Gateway 控制台里是「切换页面（`view` 子路由）」——点了会离开当前列表页、整页切换到一个无侧栏上下文的新表单页，体验割裂且丢失上下文。
- **改为弹窗**：三者统一改为 `<Teleport to="body">` + `.modal-overlay` 的居中模态弹窗，不再切换底层页面，保留列表上下文：
  - GitHub 导入 → `importOpen` 控制（面板标题 `skills.import`）。
  - 新建/编辑技能 → `skillModalOpen` 控制（面板标题 `skill.editor`；`skillDraft.id` 有值即“编辑”）。
  - 新建/编辑 SSH 服务器 → `targetModalOpen` 控制（面板标题 `target.provision`；`editingTargetId` 有值即“编辑”）。
- **脚本逻辑**：新增 `skillModalOpen` / `targetModalOpen` ref；新增 `closeSkillModal()` / `closeTargetModal()`（后者同时清 `editingTargetId`）；`newSkill` / `editSkill` / `newTarget` / `editTarget` 不再写 `view`，改为把对应 `ModalOpen` 置真；`saveSkill` / `saveTarget` 保存成功后关闭弹窗再 `selectView`；`selectView` 开头统一重置两个弹窗状态；`currentTitle` 移除 `skill` / `target-form` 子路由 label。
- **样式**：新增 `.gateway-modal`（`width: min(760px, 100%)`、`max-height: 88vh`、`display:flex; flex-direction:column`、背景 `--bg-elevated`、边框 `--border`、圆角 `8px`、`overflow:hidden`）与 `.gateway-modal .panel-content`（`flex:1; min-height:0; overflow:auto`），保证长表单内滚、整体不超出视口。
- **验证**：`npm run build` 通过；浏览器（Playwright mock API）实测点击「新建技能」「GitHub 导入」「添加服务器」均在原地弹出居中模态并正常关闭。

### 追加：其余内联编辑面板一并弹窗化（保持一致）

`Client/src/components/Gateway/GatewayConsole.vue`（2026-08-31 深夜续，`cd Client && npm run build` 即生效）：

- 为与上述三个弹窗保持一致，把原本**内联展开**（`.form-panel`，非切换页面）的三块也改为 `<Teleport to="body">` + `.gateway-modal` 居中弹窗：
  - 编辑用户权限 → `userModalOpen` 控制（面板标题 `user.permissions`；`editUser` 打开、`cancelEditUser`/`saveUserPermissions`/关闭按钮复位）。
  - 新建/编辑提示词 → `promptModalOpen` 控制（面板标题 `prompt.editor`）。
  - 新建/编辑 AI 产物 → `artifactModalOpen` 控制（面板标题 `artifact.editor`）。
- 关闭函数：`closePromptModal()` / `closeArtifactModal()` / `closeUserModal()`（`closeUserModal` 复调 `cancelEditUser` 清理草稿）；`selectView` 开头一并重置三个弹窗状态。
- 验证：`npm run build` 通过；Playwright mock API 实测「编辑权限」「新建模板」「新建产物」均原地弹出居中模态，保存后自动关闭。


## 2026-08-31 深夜续：Gateway 弹窗样式美化

`Client/src/components/Gateway/GatewayConsole.vue`（无需重启进程，`cd Client && npm run build` 即生效）：

- **范围**：统一美化 6 处 Teleport 居中弹窗（`skills.import` / `skill.editor` / `target.provision` / `user.permissions` / `prompt.editor` / `artifact.editor`），全部复用博客全局 token，保证与博客 UI 一致。
- **遮罩 `.modal-overlay`**：加 `backdrop-filter: blur(8px) saturate(120%)` 背景高斯模糊去噪、`animation: fadeIn .25s` 淡入。
- **弹窗卡片 `.conv-modal / .gateway-modal`**：背景改 `--bg-float`、边框 `--border-strong`、圆角从 8px 提升到 `--radius-lg`(16px)；多层阴影（`0 32px 90px -28px var(--shadow-deep)` 深投影 + `0 0 0 1px var(--accent-a10)` 细描边 + `0 0 48px -12px var(--accent-a20)` accent 光晕）；新增 `@keyframes modalIn`（`scale(.94) translateY(10px)` → `none`，弹性 `cubic-bezier(.2,.9,.25,1.12)` 入场）。
- **面板头 `.panel-bar`**：渐变背景 `linear-gradient(180deg, var(--overlay-a8), transparent)`、dot 加 `0 0 8px -1px var(--accent-a25)` 发光、标题字距加大(letter-spacing 1.6px)。
- **关闭按钮 `.conv-close`**：hover 旋转 90° + 背景高亮(`--accent-a15`) + 文字 `--text-bright`。
- **表单字段**：`label`/`input`/`select`/`textarea` 统一 padding 10px 12px、圆角 `--radius-md`、聚焦态 `border-color: var(--accent)` + `box-shadow: 0 0 0 3px var(--accent-a15)` 光圈 + 背景提亮 `--bg-elevated`、过渡动画 `.18s`；`textarea` 最小高 120px、可纵向拉伸。
- **布局细节**：`form-grid` 双列、`access-grid` 自适应(auto-fill minmax(150px,1fr))、`import-options` flex-wrap、`token-notice` 警告色卡片、`actions` 间距 20px。
- **验证**：`npm run build` 通过（dist 生成 `GatewayConsole-D0SNxc_p.css` / `GatewayConsole-D8Po_D2H.js`）；Playwright mock API 实测 6 个弹窗均居中、圆角/阴影/入场动画正常、无 JS 报错(仅 mock 的 `/me` 401)。


### 小修：知识库项目改为下拉选择

`Client/src/components/Gateway/GatewayConsole.vue`（`cd Client && npm run build` 即生效）：SSH 服务器弹窗（`target.provision`）的「知识库项目」字段由 `<input>` 改为 `<select>` 下拉，选项来自 `projects`，首个 `value=""` 为「未绑定（可选）」，免手敲项目名。
