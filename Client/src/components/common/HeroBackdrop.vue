<template>
  <!-- 首屏「印在纸上的画」背景层：wash + 点阵 + 暗角，样式全在全局 style.css 的 .hero-art -->
  <div class="hero-art" :data-art="art" aria-hidden="true">
    <div class="hero-wash"></div>
    <div class="hero-halftone"></div>
    <div class="hero-vignette"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 首页与公司页共用：同一套画、不同的 session key，互不干扰
const props = defineProps({
  sessionKey: { type: String, default: 'blog-hero-art' },
  artCount: { type: Number, default: 6 },
})

const art = ref(pickArt())

function pickArt() {
  // ?art=1..N 可指定，方便对稿
  const forced = Number(new URLSearchParams(window.location.search).get('art'))
  if (Number.isInteger(forced) && forced >= 1 && forced <= props.artCount) return forced
  let last = 0
  try { last = Number(sessionStorage.getItem(props.sessionKey)) || 0 } catch { /* 隐私模式下忽略 */ }
  const pool = Array.from({ length: props.artCount }, (_, i) => i + 1).filter((n) => n !== last)
  const picked = pool[Math.floor(Math.random() * pool.length)] || 1
  try { sessionStorage.setItem(props.sessionKey, String(picked)) } catch { /* 忽略 */ }
  return picked
}
</script>
