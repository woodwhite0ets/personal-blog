<template>
  <!-- 公司域：走公司站的壳（顶栏 + 页脚 + 按钮语言），不要把人丢到博客 -->
  <CompanyShell v-if="onCompany">
    <div class="co-main">
      <section class="co-sec">
        <p class="co-nf-code" aria-hidden="true">404</p>
        <h1 class="co-page-title">这一页不见了</h1>
        <p class="co-lead">你要找的内容可能已被移动或删除；从下面两个入口都能继续看。</p>
        <div class="co-actions">
          <router-link class="co-btn co-btn-solid" to="/">回公司首页</router-link>
          <router-link class="co-btn" to="/work">看案例</router-link>
        </div>
      </section>
    </div>
  </CompanyShell>

  <!-- 博客域：保持原来的排版语言 -->
  <div v-else class="nf-page">
    <span class="edge-label" aria-hidden="true">404 · woodwhite@blog</span>
    <div class="nf-inner deco-hero">
      <p class="nf-code">404</p>
      <h1 class="nf-title">这一页不见了</h1>
      <p class="nf-text">你要找的内容可能已被移动或删除。</p>
      <router-link to="/blog" class="nf-link">回到首页</router-link>
      <span class="deco-end" aria-hidden="true"></span>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import CompanyShell from './Company/CompanyShell.vue'
import { isCompanyHost } from '../utils/host.js'

const onCompany = isCompanyHost()

onMounted(() => {
  // 404 不在 meta 表里，标题自己写，别让标签页停在上一个页面的标题
  document.title = onCompany ? '页面不存在 — 木白 woodwhite' : '页面不存在 — woodwhite@blog'
})
</script>

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
  font-size: clamp(4rem, 12vw, 7.5rem);
  line-height: .9;
}
.nf-title {
  margin: 0;
  padding: 0 0 18px;
  border-bottom: 1px solid var(--border);
  color: var(--text-bright);
  font-family: var(--font-hand);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 400;
  line-height: 1.15;
}
.nf-text { margin: 20px 0 28px; color: var(--text-dim); font-size: 1rem; }
.nf-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 1rem;

  border-bottom: 1px solid var(--accent);
  padding-bottom: 3px;
}
.nf-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
@media (max-width: 860px) {
  .nf-page { padding: 64px 24px; }
}

.co-nf-code {
  margin: 0 0 10px; font-family: var(--font-mono); font-size: 0.75rem;
  letter-spacing: .18em; color: var(--accent);
}
</style>
