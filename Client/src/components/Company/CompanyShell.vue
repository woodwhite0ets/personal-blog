<template>
  <div ref="pageRef" class="co-page" :class="{ 'is-scrolled': scrolled }">
    <div class="page-wash" aria-hidden="true"></div>
    <div class="co-rail" aria-hidden="true"><span class="co-rail-fill"></span></div>

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

const pageRef = ref(null)
const scrolled = ref(false)
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

  // 先接管再隐藏：隐藏初始态的样式挂在 .co-anim 下，JS 没跑到就永远不会藏内容
  pageRef.value?.classList.add('co-anim')
  items.forEach((el) => el.classList.add('co-reveal'))

  if (typeof IntersectionObserver === 'undefined') {
    items.forEach((el) => el.classList.add('is-in'))
    return
  }
  // 兜底：首屏本就该看到的块直接放出来，不等观察器（观察器漏事件时也不会整段空白）
  const vh = window.innerHeight
  items.forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('is-in')
  })
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
  // ?motion=off 是逃生开关：不加 .co-anim、不挂观察器，所有内容直接可见
  let motionOff = false
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('motion') === 'off') {
      motionOff = true
      localStorage.setItem('co-motion', 'off')
    } else if (q.get('motion') === 'on') {
      localStorage.removeItem('co-motion')
    } else if (localStorage.getItem('co-motion') === 'off') {
      motionOff = true
    }
  } catch (e) { /* 隐私模式下 localStorage 不可用，忽略 */ }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
  if (!motionOff) revealInit()
})
onUnmounted(() => {
  restoreThemeColor()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (raf) cancelAnimationFrame(raf)
  if (io) io.disconnect()
})
</script>
