<template>
  <div class="co-page" :class="{ 'is-scrolled': scrolled, 'force-motion': forceMotion }">
    <div class="page-wash" aria-hidden="true"></div>

    <SiteNav variant="company" />
    <div class="co-ticker" aria-hidden="true">
      <div class="co-ticker-track">
        <span v-for="n in 2" :key="n" class="co-ticker-run">
          厦门翔安 · 可开票 · 一天内回信 · 自建推理 7×24 · 知识库检索 / 模型接入 / 本地推理 · 项目按阶段验收 · 交付即可运行
        </span>
      </div>
    </div>
    <slot />
    <CompanyFooter />
  </div>
</template>

<script setup>
// 公司站外壳：图纸底 + 顶栏 + 页脚。
// 样式只有一套（company.css）→ 只随公司路由加载，博客页面不再携带这一层。
import { ref, onMounted, onUnmounted } from 'vue'
import './company.css'
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

// 出场动画只挂在这些块上；删掉模板里的块时记得同步这一行，否则观察器在空跑
function revealInit() {
  const sel = '.co-svc, .co-std, .co-gauge-cell, .co-meter li, .co-card, .mkt-steps li, .co-faq-item, .co-proof li, .co-board-tile, .co-h2, .co-lib-card, .co-mast-item, .co-cta'
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

// 移动端浏览器工具栏颜色跟着站点底色走；博客页面各自还原
const THEME_COLOR = '#ebedee'
let prevThemeColor = null
function setThemeColor() {
  const el = document.head.querySelector('meta[name="theme-color"]')
  prevThemeColor = el ? el.getAttribute('content') : null
  if (!el) {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    meta.setAttribute('content', THEME_COLOR)
    document.head.appendChild(meta)
    return
  }
  el.setAttribute('content', THEME_COLOR)
}
function restoreThemeColor() {
  const el = document.head.querySelector('meta[name="theme-color"]')
  if (!el) return
  if (prevThemeColor == null) el.remove()
  else el.setAttribute('content', prevThemeColor)
}

onMounted(() => {
  setThemeColor()
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
  restoreThemeColor()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (raf) cancelAnimationFrame(raf)
  if (io) io.disconnect()
})
</script>
