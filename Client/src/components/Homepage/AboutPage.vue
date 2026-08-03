<template>
  <div class="about-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>
    <div class="bg-glow"></div>

    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/about</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/HomePage"><span class="nav-num">01</span> 首页</router-link>
          <router-link to="/archive"><span class="nav-num">02</span> 归档</router-link>
          <router-link to="/about"><span class="nav-num">03</span> 关于</router-link>
        </nav>
        <div class="nav-actions">
          <ThemeSwitcher />
        </div>
      </div>
    </header>

    <div class="about-main">
      <!-- 个人简介 -->
      <div class="about-hero">
        <div class="avatar-box">
          <UserAvatar :src="profile?.avatar" :alt="'WoodWhite'" size="xl" />
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
          <span class="panel-dot dot-cyan"></span>
          <span class="panel-dot dot-cyan dim"></span>
          <span class="panel-title">关于本站 · readme.md</span>
        </div>
        <div class="panel-body markdown-body">
          <p>欢迎来到 <strong>woodwhite@blog</strong> —— 一个以终端 / HUD 美学为主题的技术博客。</p>
          <ul>
            <li>用 <strong>Markdown</strong> 分享技术知识</li>
            <li>自由注册、发布、评论，构建技术社区</li>
            <li>极简、快速、无干扰的阅读体验</li>
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
          <span class="panel-dot dot-yellow"></span>
          <span class="panel-dot dot-yellow dim"></span>
          <span class="panel-title">项目经历 · experience</span>
        </div>
        <div class="panel-body">
          <div class="project-item">
            <div class="project-head">
              <span class="project-name">woodwhite@blog</span>
              <span class="project-status">进行中</span>
            </div>
            <p class="project-desc">本站 —— 一个基于 Vue 3 + Express + MySQL 的全栈技术博客，包含完整的认证、文章、评论、点赞、管理后台系统。</p>
            <div class="project-tags">
              <span class="ptag">Vue 3</span><span class="ptag">Express</span><span class="ptag">MySQL</span><span class="ptag">Docker 部署</span>
            </div>
          </div>
          <div class="project-item">
            <div class="project-head">
              <span class="project-name">更多项目整理中...</span>
              <span class="project-status dim-status">待补充</span>
            </div>
            <p class="project-desc">这里可以补充你的其他项目经历、工作经历、开源贡献等。</p>
          </div>
        </div>
      </div>

      <!-- 联系方式 -->
      <div class="about-panel">
        <div class="panel-bar">
          <span class="panel-dot dot-green"></span>
          <span class="panel-dot dot-green dim"></span>
          <span class="panel-title">联系方式 · contact</span>
        </div>
        <div class="panel-body">
          <div class="contact-line">
            <span class="contact-icon">✉</span>
            <span class="contact-label">邮箱</span>
            <a class="contact-val" href="mailto:1903784785@qq.com">1903784785@qq.com</a>
          </div>
          <div class="contact-line">
            <span class="contact-icon">⌥</span>
            <span class="contact-label">GitHub</span>
            <a class="contact-val" href="https://github.com/woodwhite0ets" target="_blank" rel="noopener">github.com/woodwhite0ets</a>
          </div>
          <div class="contact-line">
            <span class="contact-icon">◆</span>
            <span class="contact-label">微信</span>
            <span class="contact-val">Woodwhite-0827</span>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter command="cat /etc/motd" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
import UserAvatar from '../common/UserAvatar.vue'
import SiteFooter from '../common/SiteFooter.vue'

// 从后端动态获取头像，与用户主页头像保持同步
const profile = ref(null)

onMounted(async () => {
  try {
    const res = await fetch('/api/users/WoodWhite')
    if (res.ok) {
      const data = await res.json()
      profile.value = data.user || null
    }
  } catch { /* 头像获取失败则显示首字符占位 */ }
})
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(var(--overlay-a15) 1px, transparent 1px),
    linear-gradient(90deg, var(--overlay-a15) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

.bg-scanline {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline) 2px, var(--scanline) 4px);
  pointer-events: none; z-index: 0;
  animation: scan 8s linear infinite;
}
@keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }

.bg-glow {
  position: fixed; top: -15%; left: 50%; transform: translateX(-50%);
  width: 800px; height: 500px;
  background: radial-gradient(ellipse, var(--accent-a8) 0%, transparent 60%);
  pointer-events: none; z-index: 0;
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

/* About */
.about-main { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; padding: 48px 24px; display: flex; flex-direction: column; gap: 24px; animation: fadeInUp 0.5s ease; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

/* 个人简介 hero */
.about-hero {
  display: flex; align-items: center; gap: 24px;
  padding: 32px 28px;
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 4px 24px var(--shadow);
}
.avatar-box { flex-shrink: 0; }
.hero-name { font-size: 24px; color: var(--text-bright); margin-bottom: 6px; }
.hero-tagline { font-size: 13px; color: var(--accent); margin-bottom: 12px; }
.hero-desc { font-size: 13px; line-height: 1.8; color: var(--text-secondary); margin: 0; }

/* 通用面板 */
.about-panel {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
  transition: border-color 0.3s, transform 0.3s;
}
.about-panel:hover { border-color: var(--accent-a25); transform: translateY(-2px); }
.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: var(--accent); }
.dot-yellow { background: var(--warn); }
.dot-green  { background: var(--ok); }
.dim { opacity: 0.3; }
.panel-title { flex: 1; font-size: 11px; font-weight: 600; color: var(--text-muted); text-align: center; letter-spacing: 1.5px; }
.panel-body { padding: 20px 24px; }

.markdown-body { font-size: 14px; line-height: 1.8; color: var(--text); }
.markdown-body p { margin: 0 0 12px; }
.markdown-body ul { padding-left: 20px; margin: 0; }
.markdown-body li { margin: 4px 0; }
.markdown-body strong { color: var(--text-bright); }
.stack-line { font-size: 12px; color: var(--text-dim); margin-top: 16px; }
.c-accent { color: var(--accent); } .c-ok { color: var(--ok); } .c-warn { color: var(--warn); } .c-purple { color: var(--purple); }

/* 项目 */
.project-item { padding: 14px 0; border-bottom: 1px solid var(--border); }
.project-item:last-child { border-bottom: none; padding-bottom: 0; }
.project-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.project-name { font-size: 14px; font-weight: 600; color: var(--text-bright); }
.project-status { font-size: 10px; font-weight: 700; color: var(--ok); background: var(--ok-a10); padding: 2px 8px; border-radius: 10px; border: 1px solid var(--ok-a30); }
.dim-status { color: var(--text-faint); background: transparent; border-color: var(--border); }
.project-desc { font-size: 12px; line-height: 1.7; color: var(--text-secondary); margin: 0 0 10px; }
.project-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.ptag { font-size: 10px; color: var(--accent); background: var(--accent-a6); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--accent-a15); }

/* 联系方式 */
.contact-line { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.contact-line:last-child { border-bottom: none; }
.contact-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--accent); background: var(--accent-a8); border-radius: 6px; font-size: 14px; }
.contact-label { font-size: 12px; color: var(--text-muted); width: 56px; flex-shrink: 0; }
.contact-val { font-size: 13px; color: var(--text); text-decoration: none; transition: color 0.2s; }
a.contact-val:hover { color: var(--accent); }
.dim-val { color: var(--text-faint); }

@media (max-width: 560px) {
  .about-hero { flex-direction: column; text-align: center; }
  .nav-links { display: none; }
}
</style>
