<template>
  <div class="archive-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/archive</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/HomePage">
            <span class="nav-num">01</span> 首页
          </router-link>
          <router-link to="/archive">
            <span class="nav-num">02</span> 归档
          </router-link>
          <router-link to="/about">
            <span class="nav-num">03</span> 关于
          </router-link>
        </nav>
        <div class="nav-actions">
          <ThemeSwitcher />
        </div>
      </div>
    </header>

    <div class="archive-main">
      <div class="archive-header">
        <h1 class="archive-title">~/posts/archive</h1>
        <p class="archive-sub">共收录 {{ posts.length }} 篇文章</p>
      </div>

      <div v-if="loading" class="state-box">
        <span class="spinner"></span>
        <span>正在加载归档...</span>
      </div>

      <div v-else-if="error" class="state-box error">
        {{ error }}
      </div>

      <div v-else-if="!posts.length" class="state-box">
        暂无文章。
      </div>

      <div v-else class="archive-list">
        <div v-for="(group, year) in groupedPosts" :key="year" class="year-group">
          <div class="year-head">
            <span class="year-bracket">[</span>
            <span class="year-num">{{ year }}</span>
            <span class="year-bracket">]</span>
            <span class="year-count">{{ group.length }} 篇文章</span>
          </div>
          <div class="year-posts">
            <router-link
              v-for="p in group"
              :key="p.id"
              :to="`/post/${p.slug}`"
              class="archive-item"
            >
              <span class="arch-date">{{ p.date }}</span>
              <span class="arch-title">{{ p.title }}</span>
              <span class="arch-tag" v-if="p.tag">{{ p.tag }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <SiteFooter command="ls -laR ./posts/" />
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
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
  min-height: 100vh;
  background: var(--bg);
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(var(--overlay-a15) 1px, transparent 1px),
    linear-gradient(90deg, var(--overlay-a15) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

.bg-scanline {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline) 2px, var(--scanline) 4px);
  pointer-events: none; z-index: 0;
  animation: scan 8s linear infinite;
}
@keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }

/* Navbar */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--navbar-bg); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}
.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 14px; font-weight: 600; }
.brand-bracket { color: var(--text-muted); }
.brand-text { color: var(--accent); }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }
.nav-links { display: flex; gap: 28px; flex: 1; }
.nav-links a { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 12px; font-weight: 500; color: var(--text-dim); transition: color 0.2s; letter-spacing: 0.5px; }
.nav-num { color: var(--text-faint); font-size: 10px; font-weight: 700; }
.nav-links a:hover, .nav-links a.router-link-active { color: var(--text); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }
.nav-actions { display: flex; align-items: center; gap: 12px; }

/* Archive */
.archive-main { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 56px 24px; }
.archive-header { margin-bottom: 40px; }
.archive-title { font-size: 22px; font-weight: 800; color: var(--text-bright); margin: 0 0 8px; }
.archive-sub { font-size: 11px; color: var(--text-muted); margin: 0; }

.state-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 48px 20px; font-size: 13px; color: var(--text-muted); }
.state-box.error { color: var(--err); }
.spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.year-group { margin-bottom: 36px; }
.year-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.year-bracket { color: var(--text-faint); font-weight: 700; font-size: 16px; }
.year-num { font-size: 20px; font-weight: 800; color: var(--accent); }
.year-count { font-size: 11px; color: var(--text-muted); }

.year-posts { display: flex; flex-direction: column; }
.archive-item { display: flex; align-items: center; gap: 16px; padding: 8px 0; text-decoration: none; border-bottom: 1px solid var(--overlay-a2); transition: background 0.15s; }
.archive-item:hover { background: var(--accent-a2); }
.arch-date { font-size: 11px; color: var(--text-muted); font-weight: 600; min-width: 85px; font-family: 'JetBrains Mono', monospace; }
.arch-title { flex: 1; font-size: 14px; color: var(--text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arch-tag { font-size: 10px; color: var(--text-faint); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

</style>
