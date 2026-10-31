<template>
  <div class="about-page">

    <span class="edge-label" aria-hidden="true">关于 · woodwhite@blog</span>

    <SiteNav />

    <div class="about-main">
      <!-- 个人简介 -->
      <div class="about-hero deco-hero">
        <div class="avatar-box">
          <UserAvatar src="/uploads/avatars/msa76e9z-taqz.jpg" :alt="'WoodWhite'" size="xl" />
        </div>
        <div class="hero-info">
          <h1 class="hero-name">WoodWhite</h1>
          <p class="hero-tagline">应届毕业生 · Web 全栈开发</p>
          <p class="hero-desc">
            本科应届生，主修 Web 前端与全栈开发，熟悉 Vue 3、Node.js、MySQL 等技术栈。
            持续学习、乐于分享，希望在实践中不断成长。
          </p>
        </div>
      </div>

      <!-- 关于本站 -->
      <div class="about-panel">
        <div class="panel-bar">
          <span class="panel-title deco-rule">关于本站</span>
        </div>
        <div class="panel-body markdown-body">
          <p>这里是 <strong>woodwhite@blog</strong> —— 一个记录全栈开发与工程实践的技术博客。</p>
          <ul>
            <li>用 <strong>Markdown</strong> 分享技术知识</li>
            <li>用 <strong>Markdown</strong> 记录项目、踩坑与思考</li>
            <li>纸面般的阅读体验，安静、无干扰</li>
            <li>游客模式：无需注册即可浏览</li>
            <li>完全开源，可自由部署</li>
          </ul>
          <p class="stack-line">
            技术栈：<span class="c-accent">Vue 3</span> +
            <span class="c-ok">Express 5</span> +
            <span class="c-warn">MySQL</span> +
            <span class="c-purple">Vite</span>
          </p>
        </div>
      </div>

      <!-- 项目 / 经历 -->
      <div class="about-panel">
        <div class="panel-bar">
          <span class="panel-title deco-rule">项目经历</span>
        </div>
        <div class="panel-body">
          <div class="project-item">
            <div class="project-head">
              <router-link class="project-name" to="/projects/blog">woodwhite@blog</router-link>
              <span class="project-status">进行中</span>
            </div>
            <p class="project-desc">本站 —— 一个基于 Vue 3 + Express + MySQL 的全栈技术博客，包含完整的认证、文章、评论、点赞、管理后台系统。</p>
            <div class="project-tags">
              <span class="ptag">Vue 3</span><span class="ptag">Express</span><span class="ptag">MySQL</span><span class="ptag">Docker 部署</span>
            </div>
          </div>

          <div class="project-item" id="workspace">
            <div class="project-head">
              <span class="deco-idx">02</span>
              <router-link class="project-name" to="/projects/workstation">个人 AI 工作站</router-link>
              <span class="project-status">长期运行</span>
            </div>
            <p class="project-desc">一台自建 Ubuntu 服务器，用 systemd 与定时器长期托管本地模型（llama.cpp 三实例）、知识库检索（pgvector + rerank）、MCP 网关、自建 Git 与 CI、共享盘与反向代理；对外服务只经出站隧道暴露。原先独立的 mcp-gateway 项目已经并进这台机器。</p>
            <div class="project-tags">
              <span class="ptag">Ubuntu</span><span class="ptag">systemd</span><span class="ptag">llama.cpp</span><span class="ptag">pgvector</span><span class="ptag">MCP</span>
            </div>
          </div>

          <div class="project-item">
            <div class="project-head">
              <span class="deco-idx">03</span>
              <span class="project-name">智能电力监控平台</span>
              <span class="project-status dim-status">多协议工业数据采集</span>
            </div>
            <p class="project-desc">面向工业场景的电力监控系统，支持多种协议的数据采集与整合。</p>
            <div class="project-tags">
              <span class="ptag">数据采集</span><span class="ptag">多协议</span><span class="ptag">工业物联网</span>
            </div>
          </div>

          <div class="project-item">
            <div class="project-head">
              <span class="deco-idx">04</span>
              <router-link class="project-name" to="/projects/charging-map">乐清市充电桩分布图</router-link>
              <span class="project-status dim-status">检定监管平台</span>
            </div>
            <p class="project-desc">充电桩分布与检定监管系统，经历过从单体 SQLite 到 Docker + PostGIS 的架构升级，涉及地理信息可视化与数据管理。</p>
            <div class="project-tags">
              <span class="ptag">PostGIS</span><span class="ptag">Docker</span><span class="ptag">GIS 可视化</span><span class="ptag">架构升级</span>
            </div>
          </div>

          <div class="project-item">
            <div class="project-head">
              <span class="deco-idx">05</span>
              <router-link class="project-name" to="/projects/notes">AI 工具链实践</router-link>
              <span class="project-status dim-status">Claude Code 生态</span>
            </div>
            <p class="project-desc">围绕 Claude Code / CC Switch / Router / DeepSeek 等 AI 开发工具的使用与排障，分享配置方法与实战经验。</p>
            <div class="project-tags">
              <span class="ptag">Claude Code</span><span class="ptag">AI 工具</span><span class="ptag">效率提升</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 联系方式 -->
      <div class="about-panel">
        <div class="panel-bar">
          <span class="panel-title deco-rule">联系方式</span>
        </div>
        <div class="panel-body">
          <div class="contact-line">
            <span class="contact-label">邮箱</span>
            <a class="contact-val deco-link" href="mailto:1903784785@qq.com">1903784785@qq.com</a>
          </div>
          <div class="contact-line">
            <span class="contact-label">GitHub</span>
            <a class="contact-val deco-link" href="https://github.com/woodwhite0ets" target="_blank" rel="noopener">github.com/woodwhite0ets</a>
          </div>
          <div class="contact-line">
            <span class="contact-label">微信</span>
            <span class="contact-val">Woodwhite-0827</span>
          </div>
        </div>
      </div>

      <span class="deco-end" aria-hidden="true"></span>
    </div>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SiteNav from '../common/SiteNav.vue'
import UserAvatar from '../common/UserAvatar.vue'
import SiteFooter from '../common/SiteFooter.vue'

// 从后端动态获取头像，与用户主页头像保持同步
const profile = ref(null)
const navOpen = ref(false)

onMounted(async () => {
  try {
    const res = await fetch('/api/users/WoodWhite')
    if (res.ok) {
      const data = await res.json()
      profile.value = data.user || null
    }
  } catch { /* 头像获取失败则显示首字符占位 */ }

  // 带 #锚点 进来时，等头像/内容撑开后校正一次滚动位置
  // （路由的 scrollBehavior 在内容未稳定时算的偏移会偏，实测能偏 200px+）
  if (location.hash) {
    const target = document.querySelector(location.hash)
    if (target) {
      setTimeout(() => {
        const y = target.getBoundingClientRect().top + window.scrollY - 84
        window.scrollTo({ top: y, behavior: 'smooth' })
      }, 320)
    }
  }
})
</script>

<style scoped>
.about-page {
  min-height: 100dvh;
  background: var(--bg);
  font-family: var(--font-sans);
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

/* Navbar */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--navbar-bg); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}
.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 14px; font-weight: 600; }
.brand-bracket { color: var(--text-muted); }
.brand-text { color: var(--accent); }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }
.nav-links { display: flex; gap: 28px; flex: 1; }
.nav-links a { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 12px; font-weight: 500; color: var(--text-dim); transition: color 0.2s; letter-spacing: 0.5px; }
.nav-num { color: var(--text-faint); font-size: 10px; font-weight: 700; }
.nav-links a:hover, .nav-links a.router-link-active { color: var(--text); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.nav-toggle { display: none; position: relative; z-index: 120; flex-direction: column; justify-content: center; align-items: center; gap: 4px; width: 34px; height: 34px; background: none; border: 1px solid var(--border-strong); border-radius: 6px; cursor: pointer; padding: 0; }
.nav-toggle span { display: block; width: 16px; height: 2px; background: var(--text-dim); border-radius: 1px; transition: transform 0.2s, opacity 0.2s; }
.nav-toggle.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.nav-toggle.open span:nth-child(2) { opacity: 0; }
.nav-toggle.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

/* About */
.about-main { position: relative; z-index: 1; max-width: 1000px; margin: 0 auto; padding: 64px 24px 72px; display: flex; flex-direction: column; gap: 32px; }

/* 个人简介 hero */
.about-hero {
  display: flex; align-items: center; gap: 24px;
  padding: 0 0 28px;
  border-bottom: 1px solid var(--border);
}
.avatar-box { flex-shrink: 0; }
.hero-name { font-size: 32px; font-weight: 650; letter-spacing: -0.028em; color: var(--text-bright); margin: 0 0 8px; line-height: 1.1; }
.hero-tagline { font-size: 13px; color: var(--accent); margin-bottom: 12px; }
.hero-desc { font-size: 13px; line-height: 1.8; color: var(--text-secondary); margin: 0; }

/* 通用面板 */
.about-panel { border-bottom: 1px solid var(--border); padding-bottom: 8px; }
.panel-bar { display: flex; align-items: center; gap: 7px; padding: 0 0 10px; }
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: var(--accent); }
.dot-yellow { background: var(--warn); }
.dot-green  { background: var(--ok); }
.dim { opacity: 0.3; }
.panel-title { flex: 1; font-family: var(--font-hand); font-size: 22px; font-weight: 400; color: var(--text-bright); }
.section-block { width: 7px; height: 7px; background: var(--accent); flex-shrink: 0; }
.panel-rule { flex: 1; height: 1px; background: var(--border); }
.panel-body { padding: 20px 24px; }

.markdown-body { font-size: 14px; line-height: 1.8; color: var(--text); }
.markdown-body p { margin: 0 0 12px; }
.markdown-body ul { padding-left: 20px; margin: 0; }
.markdown-body li { margin: 4px 0; }
.markdown-body strong { color: var(--text-bright); }
.stack-line { font-size: 12px; color: var(--text-dim); margin-top: 16px; }
.c-accent, .c-ok, .c-warn, .c-purple { color: var(--text-dim); }

/* 项目 */
.project-item { padding: 14px 0; border-bottom: 1px solid var(--border); }
.project-item:last-child { border-bottom: none; padding-bottom: 0; }
.project-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.project-name { font-size: 14px; font-weight: 600; color: var(--text-bright); }
.project-status { font-size: 12px; color: var(--accent); font-variant-numeric: tabular-nums; }
.dim-status { color: var(--text-dim); }
.project-desc { font-size: 12px; line-height: 1.7; color: var(--text-secondary); margin: 0 0 10px; }
.project-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.ptag {
  display: inline-block; font-size: 11.5px; padding: 3px 10px;
  color: var(--pale-blue-fg); background: var(--pale-blue-bg);
  border: 1px solid color-mix(in srgb, var(--pale-blue-fg) 14%, transparent);
  border-radius: 999px;
}
.ptag + .ptag::before { content: ' · '; color: var(--border-strong); }

/* 联系方式 */
.contact-line { display: flex; align-items: baseline; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.contact-line:last-child { border-bottom: none; }
.contact-label { font-size: 13px; color: var(--text-muted); width: 56px; flex-shrink: 0; }
.contact-val { font-size: 13px; color: var(--text); text-decoration: none; transition: color 0.2s; }
a.contact-val:hover { color: var(--accent); }
.dim-val { color: var(--text-dim); }

@media (max-width: 560px) {
  .about-hero { flex-direction: column; align-items: flex-start; }
  .hero-name { width: 100%; }
  .nav-links { display: none; }
  .nav-toggle { display: flex; }
  .nav-actions { gap: 8px; }
  .nav-links.open { display: flex; position: fixed; top: 0; right: 0; bottom: 0; width: min(78vw, 300px); flex-direction: column; align-items: stretch; gap: 0; background: var(--bg); border-left: 1px solid var(--border); padding: 72px 20px 24px; z-index: 95; box-shadow: -8px 0 24px var(--shadow-soft); }
  .nav-links.open::before { content: ''; position: fixed; inset: 0; background: var(--modal-overlay); z-index: -1; }
  .nav-links.open a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 14px; }
}

.info-key { color: var(--text-dim); }
/* 项目编号下线：与首页保持一致，编号不编码任何信息 */
.deco-idx { display: none; }
</style>
