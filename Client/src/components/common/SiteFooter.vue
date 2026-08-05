<template>
  <footer class="footer">
    <!-- 备案号（法律要求） -->
    <div class="footer-beian">
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="beian-link">
        浙ICP备2026059663号-1
      </a>
      <span class="beian-sep">|</span>
      <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33038202005059" target="_blank" rel="noopener noreferrer" class="beian-link beian-ga">
        <img src="/beian-icon.png" alt="" class="beian-ga-icon" />
        浙公网安备33038202005059号
      </a>
    </div>
    <!-- 终端命令行 -->
    <div class="footer-line">
      <span class="footer-prompt">❯</span>
      <span class="footer-cmd">{{ command }}</span>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  command: { type: String, required: true }
})
</script>

<style scoped>
.footer {
  position: relative;
  z-index: 1;
  border-top: 1px solid var(--border);
  padding: 24px;
  text-align: center;
}

.footer-beian {
  margin-bottom: 10px;
}

.beian-link {
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace;
  transition: color 0.2s;
}

.beian-link:hover {
  color: var(--accent);
}

.beian-sep {
  margin: 0 8px;
  color: var(--text-faint);
  font-size: 11px;
}

.beian-ga {
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.beian-ga-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  flex-shrink: 0;
}

.footer-line {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.footer-prompt {
  color: var(--accent);
}

.footer-cmd {
  color: var(--text-muted);
}
</style>
