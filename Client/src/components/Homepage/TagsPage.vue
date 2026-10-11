<template>
  <div class="tags-page">
    <SiteNav />
    <div class="tags-main">
      <div class="tags-header">
        <h1 class="tags-title">分类</h1>
        <p class="tags-sub">共 {{ tags.length }} 个标签 · {{ total }} 篇文章</p>
      </div>
      <div v-if="loading" class="state-box">正在加载…</div>
      <div v-else-if="!tags.length" class="state-box">暂无标签。</div>
      <ul v-else class="tag-grid">
        <li v-for="t in tags" :key="t.name">
          <router-link :to="`/forum?tag=${encodeURIComponent(t.name)}`" class="tag-row">
            <span class="tag-name">#{{ t.name }}</span>
            <span class="tag-count">{{ t.post_count }}</span>
          </router-link>
        </li>
      </ul>
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
    tags.value = d.tags || []
    total.value = (d.tags || []).reduce((s, t) => s + (t.post_count || 0), 0)
  } catch { tags.value = [] } finally { loading.value = false }
})
</script>

<style scoped>
.tags-page { min-height: 100vh; }
.tags-main { max-width: 860px; margin: 0 auto; padding: 96px 24px 80px; }
.tags-header { margin: 0 0 32px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.tags-title { font-family: var(--font-hand); font-size: 40px; font-weight: 400; color: var(--text-bright); margin: 0 0 6px; }
.tags-sub { font-size: 15px; color: var(--text-dim); margin: 0; }
.tag-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; }
.tag-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); text-decoration: none; }
.tag-name { font-size: 17px; color: var(--text); transition: color .2s; }
.tag-row:hover .tag-name { color: var(--accent); }
.tag-count { font-size: 14px; color: var(--text-dim); font-variant-numeric: tabular-nums; }
.state-box { padding: 40px 0; color: var(--text-dim); }
@media (max-width: 700px) { .tag-grid { grid-template-columns: 1fr; } }
</style>
