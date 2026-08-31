<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from './stores/auth.js'

const { fetchMe } = useAuth()

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
    <div class="scroll-progress" :style="{ width: progress + '%' }"></div>
    <router-view v-slot="{ Component }">
      <transition name="router-fade" mode="out-in">
        <component :is="Component" :key="$route.path" />
      </transition>
    </router-view>
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
