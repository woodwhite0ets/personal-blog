<template>
  <div class="nf-page">
    <div class="nf-inner">
      <p class="nf-code">404</p>
      <h1 class="nf-title">这一页不见了</h1>
      <p class="nf-text">你要找的内容可能已被移动或删除。</p>
      <router-link to="/HomePage" class="nf-link">← 回到首页</router-link>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.nf-page { min-height: 72vh; display: flex; align-items: center; justify-content: center; padding: 80px 24px; }
.nf-inner { text-align: center; }
.nf-code { font-family: var(--font-hand); font-size: 88px; color: var(--text-faint); margin: 0 0 8px; line-height: 1; }
.nf-title { font-size: 26px; color: var(--text-bright); margin: 0 0 12px; }
.nf-text { font-size: 16px; color: var(--text-dim); margin: 0 0 28px; }
.nf-link { color: var(--accent); text-decoration: none; font-size: 16px; border-bottom: 1px solid transparent; padding-bottom: 1px; transition: border-color .2s; }
.nf-link:hover { border-color: var(--accent); }
</style>
