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
          <p style="color:#6e737a;font-size:12px;margin-top:20px;">
            built with <span style="color:#00d4ff;">Vue 3</span> +
            <span style="color:#2bd64e;">Express 5</span> +
            <span style="color:#feba0a;">MySQL</span>
          </p>
        </div>
      </div>
    </div>

    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">cat /etc/motd</span>
      </div>
    </footer>
  </div>
</template>



<style scoped>
.about-page {
  min-height: 100vh;
  background: #0a0a0c;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9;
  position: relative;
  overflow-x: hidden;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

.bg-scanline {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
  pointer-events: none; z-index: 0;
  animation: scan 8s linear infinite;
}
@keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }

/* Navbar */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,12,0.88); backdrop-filter: blur(16px);
  border-bottom: 1px solid #1c1d21;
}
.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}
.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 14px; font-weight: 600; }
.brand-bracket { color: #484b52; }
.brand-text { color: #00d4ff; }
.brand-path { color: #6e737a; margin-left: 8px; font-size: 12px; }
.nav-links { display: flex; gap: 28px; flex: 1; }
.nav-links a { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 12px; font-weight: 500; color: #6e737a; transition: color 0.2s; letter-spacing: 0.5px; }
.nav-num { color: #33363c; font-size: 10px; font-weight: 700; }
.nav-links a:hover, .nav-links a.router-link-active { color: #c9d1d9; }
.nav-links a.router-link-active .nav-num { color: #00d4ff; }

/* About */
.about-main { position: relative; z-index: 1; max-width: 640px; margin: 0 auto; padding: 56px 24px; display: flex; flex-direction: column; gap: 24px; }

.about-panel {
  background: #0f1013; border: 1px solid #1c1d21;
  border-radius: 8px; overflow: hidden;
}
.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: rgba(255,255,255,0.015);
  border-bottom: 1px solid #1c1d21;
}
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: #00d4ff; }
.dot-yellow { background: #feba0a; }
.dim { opacity: 0.3; }
.panel-title { flex: 1; font-size: 10px; font-weight: 600; color: #484b52; text-align: center; letter-spacing: 1.5px; text-transform: lowercase; }
.panel-body { padding: 20px 24px; }

.info-line { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; font-size: 12px; }
.info-key { color: #484b52; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
.info-val { color: #8b9098; }

.markdown-body { font-size: 14px; line-height: 1.8; color: #c9d1d9; }
.markdown-body p { margin: 0 0 12px; }
.markdown-body ul { padding-left: 20px; margin: 0; }
.markdown-body li { margin: 4px 0; }
.markdown-body strong { color: #e6edf3; }

.footer { position: relative; z-index: 1; border-top: 1px solid #1c1d21; padding: 24px; text-align: center; }
.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.footer-prompt { color: #00d4ff; }
.footer-cmd { color: #484b52; }
</style>
