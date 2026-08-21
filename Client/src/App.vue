<script setup>
import { onMounted } from 'vue'
import { useAuth, getToken, isGuest } from './stores/auth.js'

const { fetchMe, loginAsGuest } = useAuth()

onMounted(async () => {
  await fetchMe()
  // 完全未登录 → 自动以游客身份进入（访客/HR 无需注册即可浏览，评论/点赞时再提示登录）
  if (!getToken() && !isGuest()) {
    try { await loginAsGuest() } catch {}
  }
})
</script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>
