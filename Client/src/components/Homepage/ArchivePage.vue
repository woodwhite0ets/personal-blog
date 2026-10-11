<template>
  <div class="archive-page">

    <span class="edge-label" aria-hidden="true">归档 · woodwhite@blog</span>

    <SiteNav />

    <div class="archive-main">
      <header class="archive-header deco-hero">
        <h1 class="archive-title">归档</h1>
        <p class="archive-sub">共收录 {{ posts.length }} 篇文章 · <router-link to="/tags" class="archive-tags-link">按分类浏览</router-link></p>
      </header>

      <div v-if="loading" class="state-box" role="status" aria-live="polite">
        <span class="spinner" role="status" aria-label="加载中"></span>
        <span>正在加载归档…</span>
      </div>

      <div v-else-if="error" class="state-box error" role="alert">
        {{ error }}
      </div>

      <div v-else-if="!posts.length" class="state-box" aria-live="polite">
        暂无文章。
      </div>

      <div v-else class="archive-list">
        <div v-for="(group, year) in groupedPosts" :key="year" class="year-group">
          <div class="year-head deco-rule">
            <span class="year-num">{{ year }}</span>
            <span class="year-count">{{ group.length }} 篇文章</span>
          </div>
          <div class="year-posts">
            <router-link
              v-for="p in group"
              :key="p.id"
              :to="`/post/${p.slug}`"
              class="archive-item deco-link"
            >
              <span class="arch-date">{{ p.date }}</span>
              <span class="arch-title">{{ p.title }}</span>
              <span class="arch-tag" v-if="p.tag">{{ p.tag }}</span>
            </router-link>
          </div>
        </div>
      </div>
      <span class="deco-end" aria-hidden="true"></span>
    </div>

    <SiteFooter />
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'

const posts = ref([])
const loading = ref(true)
const error = ref('')

const groupedPosts = computed(() => {
  const groups = {}
  posts.value.forEach(p => {
    const year = (p.date || '').slice(0, 4) || '未知'
    if (!groups[year]) groups[year] = []
    groups[year].push(p)
  })
  // sort years desc
  const sorted = {}
  Object.keys(groups).sort((a, b) => b - a).forEach(y => { sorted[y] = groups[y] })
  return sorted
})

onMounted(async () => {
  try {
    const res = await fetch('/api/posts?status=published&page=1')
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '加载失败')
    // fetch all pages
    posts.value.push(...data.posts)
    for (let p = 2; p <= data.totalPages; p++) {
      const r2 = await fetch(`/api/posts?status=published&page=${p}`)
      const d2 = await r2.json()
      if (r2.ok) posts.value.push(...d2.posts)
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.archive-page {
  min-height: 100dvh;
  background: var(--bg);
  font-family: var(--font-sans);
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

/* 容器：契约 1000px / 左右 24px */
.archive-main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 24px;
}

.archive-header { padding: 64px 0 28px; }
.archive-title {
  font-family: var(--font-hand);
  font-size: clamp(40px, 5vw, 64px);
  font-weight: 400;
  color: var(--text-bright);
  margin: 0;
  text-wrap: balance;
  border-bottom: 1px solid var(--border);
  padding-bottom: 16px;
}
.archive-sub { margin: 12px 0 0; font-size: 15px; color: var(--text-secondary); }
.archive-tags-link { color: var(--accent); text-decoration: none; }
.archive-tags-link:hover { color: var(--accent-hover); }

.state-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 48px 20px; font-size: 13px; color: var(--text-muted); }
.state-box.error { color: var(--err); }
.spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.year-group { padding: 16px 0 8px; }
.year-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.section-block { width: 7px; height: 7px; background: var(--accent); flex-shrink: 0; }
.year-num { font-size: 15px; font-weight: 700; color: var(--text-bright); }
.year-count { font-size: 12px; color: var(--text-muted); font-variant-numeric: tabular-nums; }
.year-rule { flex: 1; height: 1px; background: var(--border); }

.year-posts { display: flex; flex-direction: column; margin-top: 8px; }
.archive-item { display: flex; align-items: baseline; gap: 24px; padding: 11px 0; text-decoration: none; border-bottom: 1px solid var(--border); }
.archive-item:last-child { border-bottom: none; }
.arch-date { font-size: 13px; color: var(--text-muted); font-weight: 600; min-width: 90px; font-variant-numeric: tabular-nums; }
.arch-title { flex: 1; min-width: 0; font-size: 15px; color: var(--text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color 0.2s; }
.archive-item:hover .arch-title { color: var(--accent); }
.arch-tag { font-size: 12px; color: var(--text-dim); font-weight: 500; }
</style>
