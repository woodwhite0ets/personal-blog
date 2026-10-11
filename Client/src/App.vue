<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from './stores/auth.js'
import { useTheme } from './stores/theme.js'

const { fetchMe } = useAuth()
useTheme() // 实例化主题 store，确保 data-theme 被应用（默认 paper）

const progress = ref(0)
const showTop = ref(false)

function onScroll() {
  const doc = document.documentElement
  const scrollTop = window.scrollY || doc.scrollTop
  const height = doc.scrollHeight - doc.clientHeight
  progress.value = height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0
  showTop.value = scrollTop > 400
}

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  fetchMe()
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div id="app">
    <a href="#main-content" class="skip-link">跳到主内容</a>
    <div class="scroll-progress" :style="{ width: progress + '%' }"></div>
    <main id="main-content" tabindex="-1">
      <router-view v-slot="{ Component }">
        <transition name="router-fade" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </transition>
      </router-view>
    </main>
    <button
      class="back-to-top"
      :class="{ visible: showTop }"
      @click="backToTop"
      title="回到顶部"
      aria-label="回到顶部"
    >
      <span class="btt-arrow">↑</span>
    </button>
  </div>
</template>
