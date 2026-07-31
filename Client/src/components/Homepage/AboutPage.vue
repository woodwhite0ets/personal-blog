<template>
  <div class="about-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/about</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/HomePage">
            <span class="nav-num">01</span> home
          </router-link>
          <router-link to="/archive">
            <span class="nav-num">02</span> archive
          </router-link>
          <router-link to="/about">
            <span class="nav-num">03</span> about
          </router-link>
        </nav>
        <div class="nav-actions">
          <ThemeSwitcher />
        </div>
      </div>
    </header>

    <div class="about-main">
      <div class="about-panel">
        <div class="panel-bar">
          <span class="panel-dot dot-cyan"></span>
          <span class="panel-dot dot-cyan dim"></span>
          <span class="panel-title">system.info</span>
        </div>
        <div class="panel-body">
          <div class="info-line"><span class="info-key">name</span><span class="info-val">woodwhite@blog</span></div>
          <div class="info-line"><span class="info-key">author</span><span class="info-val">WoodWhite</span></div>
          <div class="info-line"><span class="info-key">version</span><span class="info-val">2.0.1</span></div>
          <div class="info-line"><span class="info-key">stack</span><span class="info-val">Vue 3 + Express 5 + MySQL</span></div>
          <div class="info-line"><span class="info-key">runtime</span><span class="info-val">Node.js v26</span></div>
        </div>
      </div>

      <div class="about-panel">
        <div class="panel-bar">
          <span class="panel-dot dot-yellow"></span>
          <span class="panel-dot dot-yellow dim"></span>
          <span class="panel-title">readme.md</span>
        </div>
        <div class="panel-body markdown-body">
          <p>welcome to <strong>woodwhite@blog</strong> — a community tech forum.</p>
          <ul>
            <li>share knowledge in <strong>Markdown</strong> posts</li>
            <li>join discussions — everyone can register &amp; publish</li>
            <li>terminal / HUD aesthetic — minimal, fast, distraction-free</li>
            <li>guest mode: browse without an account</li>
            <li>open source — fork, modify, and deploy your own</li>
          </ul>
          <p style="color:var(--text-dim);font-size:12px;margin-top:20px;">
            built with <span style="color:var(--accent);">Vue 3</span> +
            <span style="color:var(--ok);">Express 5</span> +
            <span style="color:var(--warn);">MySQL</span>
          </p>
        </div>
      </div>
    </div>

    <SiteFooter command="cat /etc/motd" />
  </div>
</template>

<script setup>
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
import SiteFooter from '../common/SiteFooter.vue'
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
.about-main { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; padding: 56px 24px; display: flex; flex-direction: column; gap: 24px; }

.about-panel {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}
.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: var(--accent); }
.dot-yellow { background: var(--warn); }
.dim { opacity: 0.3; }
.panel-title { flex: 1; font-size: 10px; font-weight: 600; color: var(--text-muted); text-align: center; letter-spacing: 1.5px; text-transform: lowercase; }
.panel-body { padding: 20px 24px; }

.info-line { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; }
.info-key { color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
.info-val { color: var(--text-secondary); }

.markdown-body { font-size: 14px; line-height: 1.8; color: var(--text); }
.markdown-body p { margin: 0 0 12px; }
.markdown-body ul { padding-left: 20px; margin: 0; }
.markdown-body li { margin: 4px 0; }
.markdown-body strong { color: var(--text-bright); }

</style>
