import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ===== 滚动揭示指令 v-reveal =====
const reveal = {
  mounted(el, binding) {
    if (!window.IntersectionObserver || reduced()) return
    const dir = binding.value || 'up'
    el.classList.add('reveal')
    if (['left', 'right', 'none'].includes(dir)) el.setAttribute('data-reveal-dir', dir)
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          el.classList.add('reveal-in')
          io.unobserve(el)
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    io.observe(el)
    el._revealIO = io
  },
  unmounted(el) { if (el._revealIO) el._revealIO.disconnect() },
}

// ===== 数字滚动指令 v-count =====
const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const count = {
  mounted(el, binding) {
    const suffix = el.dataset.suffix || ''
    const dur = binding.modifiers.slow ? 1600 : (binding.modifiers.fast ? 500 : 900)
    el._countTarget = Number(binding.value) || 0
    el.textContent = (el.dataset.from || 0) + suffix
    el._countRun = () => {
      const target = el._countTarget
      if (reduced()) { el.textContent = target + suffix; return }
      const from = Number(el.dataset.from) || 0
      let start = null
      const step = (ts) => {
        if (start === null) start = ts
        const p = Math.min(1, (ts - start) / dur)
        el.textContent = Math.round(from + (target - from) * easeOut(p)) + suffix
        if (p < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) { el._countRun(); io.unobserve(el) }
      }
    }, { threshold: 0.2 })
    io.observe(el)
    el._countIO = io
  },
  updated(el, binding) {
    const target = Number(binding.value) || 0
    if (target !== el._countTarget) {
      el._countTarget = target
      if (el._countRun) el._countRun()
      else el.textContent = target + (el.dataset.suffix || '')
    }
  },
  unmounted(el) { if (el._countIO) el._countIO.disconnect() },
}

// ===== 全局按钮涟漪（委托） =====
const RIPPLE_SEL = 'button, .btn-write, .btn-login, .post-link, .tag, .post-tag, .theme-btn'
function attachRipple() {
  document.addEventListener('click', (e) => {
    const host = e.target.closest(RIPPLE_SEL)
    if (!host || host.querySelector('.ripple-ink')) return
    const rect = host.getBoundingClientRect()
    const d = Math.max(rect.width, rect.height) * 2.2
    const span = document.createElement('span')
    span.className = 'ripple-ink'
    span.style.width = span.style.height = d + 'px'
    span.style.left = (e.clientX - rect.left - d / 2) + 'px'
    span.style.top = (e.clientY - rect.top - d / 2) + 'px'
    host.appendChild(span)
    setTimeout(() => span.remove(), 700)
  })
}

const app = createApp(App)
app.directive('reveal', reveal)
app.directive('count', count)
app.use(router)
if (typeof window !== 'undefined') attachRipple()
app.mount('#app')
