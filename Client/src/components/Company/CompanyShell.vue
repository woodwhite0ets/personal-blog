<template>
  <div class="co-page" :class="{ 'is-scrolled': scrolled, 'force-motion': forceMotion }">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav variant="company" />
    <slot />
    <CompanyFooter />
  </div>
</template>

<script setup>
// 公司站外壳：纸底色 + 气团 + 顶栏 + 页脚 + 右侧进度轨。
// 样式从 company.css 引入 → 只随公司路由加载，博客页面不再携带这一层。
import { ref, onMounted, onUnmounted } from 'vue'
import './company.css'
import './direction-paper.css'
import './direction-v2.css'
import SiteNav from '../common/SiteNav.vue'
import CompanyFooter from './CompanyFooter.vue'

const scrolled = ref(false)
const forceMotion = ref(false)
let raf = 0

function onScroll() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    scrolled.value = window.scrollY > 40
  })
}

let io = null
let counted = false

function revealInit() {
  const sel = '.co-svc, .co-std, .co-case, .co-biz-item, .co-gauge-cell, .co-meter li, .co-step, .co-card, .mkt-steps li, .co-faq-item, .co-proof-row, .co-board-tile, .co-metric, .co-h2'
  const items = Array.from(document.querySelectorAll(sel))
  if (!items.length) return
  items.forEach((el) => el.classList.add('co-reveal'))

  if (typeof IntersectionObserver === 'undefined') {
    items.forEach((el) => el.classList.add('is-in'))
    return
  }
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('is-in')
      io.unobserve(e.target)
    })
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
  items.forEach((el) => io.observe(el))
}

onMounted(() => {
  // ?motion=on 可强制开启动效，用于系统级「减少动态效果」打开时的验证与演示
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('motion') === 'on') {
      forceMotion.value = true
      localStorage.setItem('co-motion', 'on')
    } else if (q.get('motion') === 'off') {
      localStorage.removeItem('co-motion')
    } else if (localStorage.getItem('co-motion') === 'on') {
      forceMotion.value = true
    }
  } catch (e) { /* 隐私模式下 localStorage 不可用，忽略 */ }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
  revealInit()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (raf) cancelAnimationFrame(raf)
  if (io) io.disconnect()
})
</script>
