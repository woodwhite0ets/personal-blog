<template>
  <div class="user-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <!-- ====== 导航栏 ====== -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/user</span>
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
        <div class="nav-actions">
          <button class="btn-search" title="search" v-if="false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <router-link v-if="isLoggedIn" to="/editor" class="btn-write">
            <span class="btn-write-icon">+</span> new post
          </router-link>
        </div>
      </div>
    </header>

    <!-- ====== 用户资料头 ====== -->
    <section class="user-hero">
      <div class="user-hero-inner">
        <div class="user-avatar-lg">{{ firstChar }}</div>
        <div class="user-info">
          <div class="user-name-line">
            <span class="user-at">@{{ username }}</span>
            <span v-if="profile?.nickname" class="user-nickname">{{ profile.nickname }}</span>
          </div>
          <p v-if="profile?.bio" class="user-bio">{{ profile.bio }}</p>
          <div class="user-stats">
            <div class="stat">
              <span class="stat-value">{{ totalPosts }}</span>
              <span class="stat-label">posts</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile?.role || 'author' }}</span>
              <span class="stat-label">role</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatDate(profile?.created_at) }}</span>
              <span class="stat-label">joined</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====== 主体 ====== -->
    <div class="main-layout">
      <PostList
        :posts="posts"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMore"
        :empty-text="`@${username} 还没有发布文章。`"
        @load-more="loadMore"
        @refresh="fetchPosts"
      />

      <aside class="sidebar">
        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">user.info</span>
          </div>
          <div class="panel-body">
            <div class="info-line">
              <span class="info-key">id</span>
              <span class="info-val">uid_{{ profile?.id || '—' }}</span>
            </div>
            <div class="info-line">
              <span class="info-key">email</span>
              <span class="info-val">{{ profile?.email || '—' }}</span>
            </div>
            <div class="info-line">
              <span class="info-key">status</span>
              <span class="info-val terminal-green">active</span>
            </div>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-yellow"></span>
            <span class="panel-dot dot-yellow dim"></span>
            <span class="panel-title">tags.used</span>
          </div>
          <div class="panel-body">
            <div class="tag-cloud">
              <span v-for="tag in userTags" :key="tag.name" class="tag" :class="tag.size">
                #{{ tag.name }}
              </span>
              <span v-if="!userTags.length" class="no-tags">— no tags yet</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- ====== 页脚 ====== -->
    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">finger @{{ username }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostList from '../Homepage/PostList.vue'
import { useAuth } from '../../stores/auth.js'

const route = useRoute()
const { isLoggedIn } = useAuth()

const API_BASE = '/api'

// ====== 用户数据 ======
const profile = ref(null)
const posts = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

const username = computed(() => route.params.username)
const firstChar = computed(() => (profile.value?.nickname || username.value).charAt(0).toUpperCase())
const hasMore = computed(() => currentPage.value < totalPages.value)
const totalPosts = computed(() => profile.value?.post_count ?? posts.value.length)

// ====== 从文章聚合标签 ======
const userTags = computed(() => {
  const tagMap = {}
  posts.value.forEach(p => {
    const t = p.tag
    if (t) tagMap[t] = (tagMap[t] || 0) + 1
  })
  return Object.entries(tagMap)
    .map(([name, count]) => ({
      name,
      size: count >= 5 ? 'lg' : count >= 3 ? 'md' : count >= 2 ? 'sm' : 'xs',
    }))
    .slice(0, 10)
})

// ====== 获取用户资料 ======
async function fetchProfile() {
  try {
    const res = await fetch(`${API_BASE}/users/${username.value}`)
    if (res.ok) {
      profile.value = (await res.json()).user
    }
  } catch { /* 展示降级 UI */ }
}

// ====== 获取文章 ======
async function fetchPosts(page = 1) {
  if (page === 1) loading.value = true
  error.value = ''

  try {
    const res = await fetch(
      `${API_BASE}/posts?page=${page}&status=published&author=${username.value}`
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'request failed')

    if (page === 1) {
      posts.value = data.posts
    } else {
      posts.value.push(...data.posts)
    }
    currentPage.value = data.page
    totalPages.value = data.totalPages
  } catch (e) {
    error.value = e.message || '获取文章失败'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  loadingMore.value = true
  await fetchPosts(currentPage.value + 1)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().split('T')[0]
}

// ====== 生命周期 ======
onMounted(() => {
  fetchProfile()
  fetchPosts()
})

// 路由参数变化时重新加载
watch(username, () => {
  profile.value = null
  posts.value = []
  fetchProfile()
  fetchPosts()
})
</script>

<style scoped>
.user-page {
  min-height: 100vh;
  background: #0a0a0c;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9;
  position: relative;
  overflow-x: hidden;
}

/* 背景 — 复用 Homepage */
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
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
  );
  pointer-events: none; z-index: 0;
  animation: scan 8s linear infinite;
}

@keyframes scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* ====== Navbar ====== */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,12,0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid #1c1d21;
}

.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}

.brand {
  display: flex; align-items: baseline; gap: 4px;
  text-decoration: none; font-size: 14px; font-weight: 600;
}

.brand-bracket { color: #484b52; }
.brand-text { color: #00d4ff; }
.brand-path { color: #6e737a; margin-left: 8px; font-size: 12px; }

.nav-links { display: flex; gap: 28px; flex: 1; }

.nav-links a {
  display: flex; align-items: center; gap: 6px;
  text-decoration: none; font-size: 12px; font-weight: 500;
  color: #6e737a; transition: color 0.2s; letter-spacing: 0.5px;
}

.nav-num { color: #33363c; font-size: 10px; font-weight: 700; }

.nav-links a:hover,
.nav-links a.router-link-active { color: #c9d1d9; }
.nav-links a.router-link-active .nav-num { color: #00d4ff; }

.nav-actions { display: flex; align-items: center; gap: 12px; }

.btn-search {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid #25262a; border-radius: 6px;
  color: #6e737a; cursor: pointer; transition: all 0.2s;
}

.btn-search:hover { border-color: #00d4ff; color: #00d4ff; }

.btn-write {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 16px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #0a0a0c; background: #00d4ff; border-radius: 6px;
  text-decoration: none; transition: all 0.2s;
}

.btn-write:hover {
  background: #00b8d4;
  box-shadow: 0 0 20px rgba(0,212,255,0.25);
  transform: translateY(-1px);
}

.btn-write-icon { font-size: 15px; font-weight: 700; }

/* ====== Hero ====== */
.user-hero {
  position: relative; z-index: 1;
  border-bottom: 1px solid #1c1d21;
  background: radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.03) 0%, transparent 60%);
}

.user-hero-inner {
  max-width: 1060px; margin: 0 auto; padding: 56px 24px 48px;
  display: flex; align-items: center; gap: 28px;
}

.user-avatar-lg {
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.05) 100%);
  border: 2px solid rgba(0,212,255,0.25);
  border-radius: 12px;
  font-size: 36px; font-weight: 800; color: #00d4ff;
  text-transform: uppercase;
  flex-shrink: 0;
}

.user-info { display: flex; flex-direction: column; gap: 8px; }

.user-name-line { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }

.user-at { font-size: 22px; font-weight: 800; color: #e6edf3; letter-spacing: -0.5px; }

.user-nickname {
  font-size: 14px; color: #6e737a; font-weight: 500;
}

.user-bio {
  font-size: 13px; color: #8b9098; line-height: 1.6;
  max-width: 520px; margin: 0;
}

.user-stats { display: flex; gap: 28px; margin-top: 4px; }

.stat { display: flex; flex-direction: column; gap: 2px; }

.stat-value {
  font-size: 13px; font-weight: 600; color: #c9d1d9;
}

.stat-label {
  font-size: 10px; color: #484b52;
  text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
}

/* ====== 主体 ====== */
.main-layout {
  position: relative; z-index: 1;
  max-width: 1060px; margin: 0 auto; padding: 56px 24px;
  display: grid; grid-template-columns: 1fr 280px; gap: 56px;
}

/* ====== 侧边栏 ====== */
.sidebar { display: flex; flex-direction: column; gap: 20px; }

.sidebar-panel {
  background: #0f1013; border: 1px solid #1c1d21;
  border-radius: 8px; overflow: hidden;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.015);
  border-bottom: 1px solid #1c1d21;
}

.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: #00d4ff; }
.dot-yellow { background: #feba0a; }
.dim { opacity: 0.3; }

.panel-title {
  flex: 1; font-size: 10px; font-weight: 600;
  color: #484b52; text-align: center;
  letter-spacing: 1.5px; text-transform: lowercase;
}

.panel-body { padding: 14px 16px; }

.info-line {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 11px;
}

.info-key {
  color: #484b52; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
}

.info-val { color: #8b9098; }
.terminal-green { color: #2bd64e; }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }

.tag {
  font-size: 11px; padding: 4px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid #1c1d21; border-radius: 4px;
  color: #6e737a; cursor: default; transition: all 0.2s;
}

.tag:hover { border-color: #00d4ff; color: #00d4ff; background: rgba(0,212,255,0.04); }
.tag.lg { font-size: 13px; font-weight: 600; }
.tag.md { font-size: 12px; }
.tag.sm { font-size: 11px; }
.tag.xs { font-size: 10px; opacity: 0.7; }

.no-tags { font-size: 11px; color: #484b52; }

/* ====== Footer ====== */
.footer {
  position: relative; z-index: 1;
  border-top: 1px solid #1c1d21; padding: 24px; text-align: center;
}

.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.footer-prompt { color: #00d4ff; }
.footer-cmd { color: #484b52; }

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .main-layout { grid-template-columns: 1fr; gap: 48px; }
  .nav-links { display: none; }
  .user-hero-inner { flex-direction: column; text-align: center; padding: 40px 20px 32px; }
  .user-stats { justify-content: center; }
  .user-avatar-lg { width: 64px; height: 64px; font-size: 28px; }
  .user-at { font-size: 18px; }
}
</style>
