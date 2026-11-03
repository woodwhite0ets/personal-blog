<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from './stores/auth.js'
import { useTheme } from './stores/theme.js'

const { fetchMe } = useAuth()
useTheme() // 实例化主题 store，确保 data-theme 被应用（默认 paper）

// 滚动进度线由 CSS scroll-driven 动画驱动（见 style.css .scroll-progress）；
// 「回到顶部」按钮的显隐用 IntersectionObserver 观察顶部哨兵，不再监听 scroll。
const showTop = ref(false)
let topObserver = null

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  fetchMe()
  const sentinel = document.getElementById('scroll-sentinel')
  if (sentinel) {
    topObserver = new IntersectionObserver(([entry]) => { showTop.value = !entry.isIntersecting })
    topObserver.observe(sentinel)
  }
})
onUnmounted(() => { if (topObserver) topObserver.disconnect() })
</script>

<template>
  <div id="app">
    <a href="#main-content" class="skip-link">跳到主内容</a>
    <div class="scroll-progress" aria-hidden="true"></div>
    <div id="scroll-sentinel" aria-hidden="true"></div>
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
