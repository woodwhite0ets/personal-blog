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
