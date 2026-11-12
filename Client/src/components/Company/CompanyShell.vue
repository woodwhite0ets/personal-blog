<template>
  <div class="co-page" :class="{ 'is-scrolled': scrolled }">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav variant="company" />
    <slot />
    <CompanyFooter />

    <!-- 页面外框与四角准星：fixed 元素挂在壳内，避免伪元素被 body 层叠顺序吞掉 -->
    <div class="co-frame" aria-hidden="true"></div>

    <!-- 右侧滚动进度轨：细轨 + 当前页竖排标签（鹰角那种侧边技术注记） -->
    <div class="co-rail" aria-hidden="true">
      <span class="co-rail-label">{{ railLabel }}</span>
      <span class="co-rail-track"><i ref="fillRef"></i></span>
    </div>
  </div>
</template>

<script setup>
// 公司站外壳：纸底色 + 气团 + 顶栏 + 页脚 + 右侧进度轨。
// 样式从 company.css 引入 → 只随公司路由加载，博客页面不再携带这一层。
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import './company.css'
import SiteNav from '../common/SiteNav.vue'
import CompanyFooter from './CompanyFooter.vue'

const route = useRoute()
const railLabel = computed(() => {
  const p = route.path
  if (p === '/') return 'HOME'
  if (p.startsWith('/work')) return 'WORK'
  if (p.startsWith('/stack')) return 'STACK'
  if (p.startsWith('/contact')) return 'CONTACT'
  if (p === '/business') return 'BUSINESS'
  if (p.startsWith('/business/startup')) return 'STARTUP'
  return ''
})

const scrolled = ref(false)
const fillRef = ref(null)
let raf = 0

function onScroll() {
  if (raf) return
  raf = requestAnimationFrame(() => {
    raf = 0
    scrolled.value = window.scrollY > 40
    const el = fillRef.value
    if (!el) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
    el.style.transform = `scaleY(${p})`
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (raf) cancelAnimationFrame(raf)
})
</script>
