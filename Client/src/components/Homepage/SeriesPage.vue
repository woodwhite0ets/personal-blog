<template>
  <div class="series-page">
    <SiteNav />

    <main class="series-main">
      <header class="series-head">
        <p class="series-kicker">系列</p>
        <h1 class="series-title">{{ name }}</h1>
        <p class="series-meta">
          <span v-if="!loading">{{ total }} 篇</span>
          <span v-if="loading">加载中…</span>
        </p>
        <p class="series-desc">同一系列下的文章按发布时间排列，从最新开始读也行，从最早开始也行。</p>
      </header>

      <PostList
        :posts="posts"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMore"
        @refresh="reload"
        @load-more="loadMore"
      />

      <div v-if="!loading && !error && posts.length === 0" class="series-empty">
        <p>这个系列下还没有文章。</p>
        <router-link to="/forum" class="series-back">去文章列表</router-link>
      </div>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import PostList from './PostList.vue'

const route = useRoute()
const name = ref(String(route.params.name || ''))
const posts = ref([])
const total = ref(0)
const page = ref(1)
const hasMore = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')

async function fetchPage(target = 1) {
  const params = new URLSearchParams({ series: name.value, status: 'published', page: String(target) })
  const res = await fetch(`/api/posts?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function reload() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchPage(1)
    posts.value = data.posts || []
    total.value = data.total ?? posts.value.length
    page.value = 1
    hasMore.value = Boolean(data.totalPages && data.totalPages > 1)
  } catch (err) {
    console.error('系列页加载失败:', err)
    error.value = '这个系列的文章没能加载出来，刷新页面试试。'
    posts.value = []
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    const next = page.value + 1
    const data = await fetchPage(next)
    const batch = data.posts || []
    posts.value = posts.value.concat(batch)
    page.value = next
    hasMore.value = Boolean(data.totalPages && next < data.totalPages)
  } catch (err) {
    console.error('加载更多失败:', err)
  } finally {
    loadingMore.value = false
  }
}

watch(() => route.params.name, (v) => {
  name.value = String(v || '')
  reload()
})

onMounted(reload)
</script>

<style scoped>
.series-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.series-main { max-width: 1200px; margin: 0 auto; padding: 64px 24px 104px; }
.series-head { padding-bottom: 24px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.series-kicker { margin: 0 0 8px; font-size: 0.75rem; letter-spacing: .08em; color: var(--text-dim); }
.series-title {
  margin: 0; font-size: clamp(1.875rem, 3.6vw, 2.75rem); font-weight: 700;
  letter-spacing: -0.02em; color: var(--text-bright); text-wrap: balance;
}
.series-meta {
  margin: 10px 0 0; font-size: 0.7812rem; color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}
.series-desc { margin: 6px 0 0; max-width: 62ch; font-size: 0.8438rem; line-height: 1.7; color: var(--text-dim); }
.series-empty { padding: 40px 2px; font-size: 0.875rem; color: var(--text-dim); }
.series-back { color: var(--accent); text-decoration: none; border-bottom: 1px solid currentColor; }
@media (max-width: 720px) { .series-main { padding: 40px 20px 72px; } }
</style>
