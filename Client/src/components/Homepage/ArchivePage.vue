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
            <span class="nav-num">01</span> home
          </router-link>
          <router-link to="/archive">
            <span class="nav-num">02</span> archive
          </router-link>
          <router-link to="/about">
            <span class="nav-num">03</span> about
          </router-link>
        </nav>
      </div>
    </header>

    <div class="archive-main">
      <div class="archive-header">
        <h1 class="archive-title">~/posts/archive</h1>
        <p class="archive-sub">total {{ posts.length }} posts indexed</p>
      </div>

      <div v-if="loading" class="state-box">
        <span class="spinner"></span>
        <span>loading archive...</span>
      </div>

      <div v-else-if="error" class="state-box error">
        {{ error }}
      </div>

      <div v-else-if="!posts.length" class="state-box">
        no posts yet.
      </div>

      <div v-else class="archive-list">
        <div v-for="(group, year) in groupedPosts" :key="year" class="year-group">
          <div class="year-head">
            <span class="year-bracket">[</span>
            <span class="year-num">{{ year }}</span>
            <span class="year-bracket">]</span>
            <span class="year-count">{{ group.length }} posts</span>
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

    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">ls -laR ./posts/</span>
      </div>
    </footer>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'

const posts = ref([])
const loading = ref(true)
const error = ref('')

const groupedPosts = computed(() => {
  const groups = {}
  posts.value.forEach(p => {
    const year = (p.date || '').slice(0, 4) || 'unknown'
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
    if (!res.ok) throw new Error(data.message || 'load failed')
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
  background: #0a0a0c;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9;
  position: relative;
  overflow-x: hidden;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

.bg-scanline {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
  pointer-events: none; z-index: 0;
  animation: scan 8s linear infinite;
}
@keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }

/* Navbar */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,12,0.88); backdrop-filter: blur(16px);
  border-bottom: 1px solid #1c1d21;
}
.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}
.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 14px; font-weight: 600; }
.brand-bracket { color: #484b52; }
.brand-text { color: #00d4ff; }
.brand-path { color: #6e737a; margin-left: 8px; font-size: 12px; }
.nav-links { display: flex; gap: 28px; flex: 1; }
.nav-links a { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 12px; font-weight: 500; color: #6e737a; transition: color 0.2s; letter-spacing: 0.5px; }
.nav-num { color: #33363c; font-size: 10px; font-weight: 700; }
.nav-links a:hover, .nav-links a.router-link-active { color: #c9d1d9; }
.nav-links a.router-link-active .nav-num { color: #00d4ff; }

/* Archive */
.archive-main { position: relative; z-index: 1; max-width: 720px; margin: 0 auto; padding: 56px 24px; }
.archive-header { margin-bottom: 40px; }
.archive-title { font-size: 22px; font-weight: 800; color: #e6edf3; margin: 0 0 8px; }
.archive-sub { font-size: 11px; color: #484b52; margin: 0; }

.state-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 48px 20px; font-size: 13px; color: #484b52; }
.state-box.error { color: #ff5f57; }
.spinner { width: 16px; height: 16px; border: 2px solid #1c1d21; border-top-color: #00d4ff; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.year-group { margin-bottom: 36px; }
.year-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #1c1d21; }
.year-bracket { color: #33363c; font-weight: 700; font-size: 16px; }
.year-num { font-size: 20px; font-weight: 800; color: #00d4ff; }
.year-count { font-size: 11px; color: #484b52; }

.year-posts { display: flex; flex-direction: column; }
.archive-item { display: flex; align-items: center; gap: 16px; padding: 8px 0; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.02); transition: background 0.15s; }
.archive-item:hover { background: rgba(0,212,255,0.02); }
.arch-date { font-size: 11px; color: #484b52; font-weight: 600; min-width: 85px; font-family: 'JetBrains Mono', monospace; }
.arch-title { flex: 1; font-size: 14px; color: #c9d1d9; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arch-tag { font-size: 10px; color: #33363c; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

.footer { position: relative; z-index: 1; border-top: 1px solid #1c1d21; padding: 24px; text-align: center; }
.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.footer-prompt { color: #00d4ff; }
.footer-cmd { color: #484b52; }
</style>
