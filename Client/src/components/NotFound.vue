<template>
  <main class="nf-page">
    <span class="edge-label" aria-hidden="true">404 · woodwhite@blog</span>
    <div class="nf-inner deco-hero">
      <p class="nf-code">404</p>
      <h1 class="nf-title">这一页不见了</h1>
      <p class="nf-text">你要找的内容可能已被移动或删除。</p>
      <router-link to="/HomePage" class="nf-link">回到首页</router-link>
      <span class="deco-end" aria-hidden="true"></span>
    </div>
  </main>
</template>

<script setup></script>

<style scoped>
.nf-page {
  min-height: 72vh;
  max-width: 1000px;
  margin: 0 auto;
  padding: 96px 24px;
  display: flex;
  align-items: center;
}
.nf-inner { width: 100%; text-align: left; }
.nf-code {
  margin: 0 0 12px;
  color: var(--accent);
  font-family: var(--font-hand);
  font-size: clamp(64px, 12vw, 120px);
  line-height: .9;
}
.nf-title {
  margin: 0;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--border);
  color: var(--text-bright);
  font-family: var(--font-hand);
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 400;
  line-height: 1.15;
}
.nf-text { margin: 20px 0 28px; color: var(--text-dim); font-size: 16px; }
.nf-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 16px;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 3px;
}
.nf-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
@media (max-width: 860px) {
  .nf-page { padding: 64px 24px; }
}
</style>
