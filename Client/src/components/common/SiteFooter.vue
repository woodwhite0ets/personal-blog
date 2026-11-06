<template>
  <footer class="footer">
    <div class="footer-cols">
      <div class="footer-brand-col">
        <span class="footer-wordmark">woodwhite@blog</span>
        <p class="footer-tagline">技术笔记与工程记录：全栈开发、系统运维、AI 工程化。</p>
        <span class="footer-status-line">
          <span class="footer-dot" aria-hidden="true"></span>
          <span>站点持续更新</span>
        </span>
      </div>

      <nav class="footer-col" aria-label="内容">
        <h3>内容</h3>
        <router-link to="/forum">全部文章</router-link>
        <router-link to="/tags">标签</router-link>
        <router-link to="/archive">归档</router-link>
        <router-link to="/ai-daily">AI 项目榜</router-link>
        <router-link to="/tools">工具库</router-link>
      </nav>

      <nav class="footer-col" aria-label="站点">
        <h3>站点</h3>
        <router-link to="/now">现在</router-link>
        <router-link to="/projects">项目</router-link>
        <router-link to="/notes">笔记</router-link>
        <router-link to="/about">关于</router-link>
        <a href="/feed.xml" type="application/rss+xml">RSS 订阅</a>
      </nav>

      <nav class="footer-col" aria-label="联系">
        <h3>联系</h3>
        <router-link to="/">木白 · 公司主页</router-link>
        <a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="mailto:1903784785@qq.com">1903784785@qq.com</a>
      </nav>
    </div>

    <div class="footer-bottom">
      <span class="footer-copy">© {{ year }} woodwhite@blog</span>
      <div class="footer-beian">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="beian-link">浙ICP备2026059663号-1</a>
        <span class="beian-sep">|</span>
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33038202005059" target="_blank" rel="noopener noreferrer" class="beian-link beian-ga">
          <img src="/beian-icon.png" alt="" class="beian-ga-icon" />浙公网安备33038202005059号
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
// command 仍被页面传入（站点状态串），保留 prop 以免调用方报错，页脚不再跑打字动画
defineProps({ command: { type: String, required: false, default: '' } })
</script>

<style scoped>
.footer {
  position: relative; z-index: 1;
  border-top: 1px solid var(--border);
  margin-top: 8px;
  padding: 40px 24px 26px;
  max-width: 1080px;
  margin-left: auto; margin-right: auto;
}
.footer-cols {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) repeat(3, minmax(0, 1fr));
  gap: 32px;
}
.footer-brand-col { display: flex; flex-direction: column; gap: 8px; max-width: 34ch; }
.footer-wordmark { font-family: var(--font-display); font-size: 1.0625rem; letter-spacing: -0.01em; color: var(--text-bright); }
.footer-tagline { margin: 0; font-size: 0.8125rem; line-height: 1.7; color: var(--text-secondary); }
.footer-status-line {
  display: inline-flex; align-items: center; gap: 7px; margin-top: 4px;
  font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .04em; color: var(--text-faint);
}
.footer-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex: none; }

.footer-col { display: flex; flex-direction: column; gap: 8px; }
.footer-col h3 {
  margin: 0 0 4px; font-family: var(--font-mono); font-size: 0.625rem; font-weight: 600;
  letter-spacing: .1em; text-transform: uppercase; color: var(--text-faint);
}
.footer-col a { font-size: 0.8125rem; color: var(--text-secondary); text-decoration: none; transition: color var(--dur-hover) var(--ease-out); }
.footer-col a:hover { color: var(--accent); }
.footer-col a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.footer-bottom {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
  margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border);
  font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .03em; color: var(--text-faint);
}
.beian-link { font-size: 0.6875rem; color: var(--text-faint); text-decoration: none; transition: color .2s; }
.beian-link:hover { color: var(--accent); }
.beian-sep { margin: 0 8px; color: var(--text-faint); }
.beian-ga { display: inline-flex; align-items: center; gap: 4px; }
.beian-ga-icon { width: 14px; height: 14px; flex-shrink: 0; }

@media (max-width: 900px) {
  .footer-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; }
}
@media (max-width: 560px) {
  .footer-cols { grid-template-columns: minmax(0, 1fr); gap: 22px; }
  .footer { padding: 32px 20px 22px; }
}
</style>
