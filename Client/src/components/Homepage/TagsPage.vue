<template>
  <div class="tags-page">
    <div class="page-wash" aria-hidden="true"></div>
    <span class="edge-label" aria-hidden="true">分类 · woodwhite@blog</span>
    <SiteNav />
    <div class="tags-main">
      <header class="tags-header deco-hero">
        <h1 class="tags-title">分类</h1>
        <p class="tags-sub">共 {{ tags.length }} 个标签，{{ total }} 篇文章</p>
      </header>
      <div v-if="loading" class="state-box" role="status" aria-live="polite">正在加载…</div>
      <div v-else-if="!tags.length" class="state-box">暂无标签。</div>
      <ul v-else class="tag-grid">
        <li v-for="(t, i) in tags" :key="t.name" :data-tier="t.post_count >= 5 ? 'high' : t.post_count >= 2 ? 'mid' : 'low'">
          <router-link :to="`/forum?tag=${encodeURIComponent(t.name)}`" class="tag-row">
            <span class="tag-name">{{ t.name }}</span>
            <span class="tag-count">{{ t.post_count }}</span>
          </router-link>
        </li>
      </ul>
      <span class="deco-end" aria-hidden="true"></span>
    </div>
    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
const tags = ref([]); const total = ref(0); const loading = ref(true)
onMounted(async () => {
  try {
    const r = await fetch('/api/tags'); const d = await r.json()
    const all = d.tags || []
    // 隐藏 0 帖标签，避免空分类
    tags.value = all.filter(t => (t.post_count || 0) > 0)
    total.value = tags.value.reduce((s, t) => s + (t.post_count || 0), 0)
  } catch { tags.value = [] } finally { loading.value = false }
})
</script>

<style scoped>
.tags-page {
  min-height: 100dvh;
  background-color: var(--bg);
  font-family: var(--font-sans);
  color: var(--text);
}

/* 容器：契约 1000px / 左右 24px */
.tags-main { max-width: var(--page-w); margin: 0 auto; padding: 64px var(--page-pad) 104px; }
.tags-header { padding: 0 0 28px; }
.tags-title { margin: 0; }
.tags-sub { margin: 12px 0 0; font-size: 0.9375rem; color: var(--text-secondary); }

.tag-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; column-gap: 48px; }
.tag-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
  padding: 13px 4px; border-bottom: 1px solid var(--border); text-decoration: none;
  transition: background-color var(--dur-hover) var(--ease-out);
  border-radius: 4px;
}
.tag-name { font-size: 1rem; color: var(--text); transition: color var(--dur-hover) var(--ease-out); }
.tag-row:hover { background: var(--overlay-a2); }
.tag-row:hover .tag-name { color: var(--text-bright); }
.tag-count { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-faint); text-align: right; font-variant-numeric: tabular-nums; }
.state-box { padding: 40px 0; color: var(--text-dim); }
@media (max-width: 860px) { .tag-grid { grid-template-columns: 1fr; } }
/* 页尾装饰双线残留下线 */
.deco-end { display: none; }
</style>
