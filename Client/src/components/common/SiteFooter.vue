<template>
  <footer class="footer">
    <div class="footer-terminal anim-fade-up">
      <div class="terminal-bar">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
        <span class="terminal-title">woodwhite@blog — zsh</span>
      </div>
      <div class="terminal-body">
        <div class="footer-line">
          <span class="footer-prompt">❯</span>
          <span class="footer-cmd">{{ displayed }}</span>
          <span class="footer-caret anim-caret">▌</span>
        </div>
        <div class="footer-status">
          <span class="status-dot"></span>
          <span>系统正常运行</span>
          <span class="footer-sep">·</span>
          <span>v2.0.1</span>
          <span class="footer-sep">·</span>
          <span>{{ typedLen }}/{{ fullCmd.length }} 字符</span>
        </div>
      </div>
    </div>

    <div class="footer-links">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
      <span class="footer-link-sep">·</span>
      <router-link to="/kb">知识库</router-link>
      <span class="footer-link-sep">·</span>
      <router-link to="/gateway">Gateway</router-link>
      <span class="footer-link-sep">·</span>
      <router-link to="/about">关于</router-link>
    </div>

    <div class="footer-beian">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="beian-link">浙ICP备2026059663号-1</a>
      <span class="beian-sep">|</span>
      <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33038202005059" target="_blank" rel="noopener noreferrer" class="beian-link beian-ga">
        <img src="/beian-icon.png" alt="" class="beian-ga-icon" />浙公网安备33038202005059号
      </a>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
const props = defineProps({ command: { type: String, required: true } })
const fullCmd = computed(() => props.command || '')
const displayed = ref('')
const typedLen = ref(0)
let timer = null
onMounted(() => {
  const text = fullCmd.value
  let i = 0
  displayed.value = ''
  typedLen.value = 0
  timer = setInterval(() => {
    i++
    displayed.value = text.slice(0, i)
    typedLen.value = i
    if (i >= text.length) clearInterval(timer)
  }, 40)
})

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.footer { position: relative; z-index: 1; border-top: 1px solid var(--border); padding: 32px 24px 24px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
.footer-terminal { width: min(720px, 100%); background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; box-shadow: 0 10px 34px var(--shadow); }
.terminal-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--overlay-a15); border-bottom: 1px solid var(--border); }
.dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.dot-red { background: var(--dot-red); }
.dot-yellow { background: var(--dot-yellow); }
.dot-green { background: var(--dot-green); }
.terminal-title { margin-left: 8px; font-size: 10px; letter-spacing: 1px; color: var(--text-muted); text-transform: uppercase; }
.terminal-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace; min-height: 20px; }
.footer-prompt { color: var(--accent); }
.footer-cmd { color: var(--text-secondary); white-space: nowrap; overflow: hidden; }
.footer-caret { color: var(--accent); font-size: 12px; }
.footer-status { display: inline-flex; align-items: center; gap: 8px; font-size: 10px; color: var(--text-muted); }
.footer-sep { opacity: 0.5; }
.footer-links { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; }
.footer-links a { font-size: 12px; color: var(--text-muted); text-decoration: none; transition: color 0.2s; }
.footer-links a:hover { color: var(--accent); }
.footer-link-sep { color: var(--text-faint); }
.footer-beian { margin-bottom: 4px; }
.beian-link { font-size: 12px; color: var(--text-muted); text-decoration: none; font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; transition: color 0.2s; }
.beian-link:hover { color: var(--accent); }
.beian-sep { margin: 0 8px; color: var(--text-faint); font-size: 11px; }
.beian-ga { color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; }
.beian-ga-icon { width: 16px; height: 16px; vertical-align: middle; flex-shrink: 0; }
</style>
