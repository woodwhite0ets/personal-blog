<template>
  <div class="home-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <!-- ====== 导航栏 ====== -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/main</span>
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
          <button class="btn-search" title="search" @click="toggleSearch" v-if="false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- 未登录 -->
          <template v-if="!isLoggedIn">
            <router-link to="/" class="btn-write">
              <span class="btn-write-icon">+</span> new post
            </router-link>
          </template>

          <!-- 已登录 -->
          <template v-else>
            <router-link to="/editor" class="btn-write">
              <span class="btn-write-icon">+</span> new post
            </router-link>
            <div class="user-menu-wrap" ref="userMenuRef">
              <button class="btn-user" @click="showUserMenu = !showUserMenu">
                <span class="user-avatar">{{ currentUser?.nickname?.charAt(0) || currentUser?.username?.charAt(0) || '?' }}</span>
                <span class="user-name">@{{ currentUser?.username }}</span>
                <span class="user-caret" :class="{ open: showUserMenu }">▾</span>
              </button>
              <div v-if="showUserMenu" class="user-dropdown">
                <router-link v-if="isAdmin" to="/admin/dashboard" class="dropdown-item admin-link" @click="showUserMenu = false">
                  <span class="dropdown-icon">⚙</span> admin panel
                </router-link>
                <router-link :to="`/user/${currentUser?.username}`" class="dropdown-item" @click="showUserMenu = false">
                  <span class="dropdown-icon">🏠</span> my page
                </router-link>
                <button class="dropdown-item logout" @click="handleLogout">
                  <span class="dropdown-icon">⏻</span> logout
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </header>

    <!-- ====== Hero：置顶文章 ====== -->
    <section v-if="pinnedPost" class="hero">
      <div class="hero-inner">
        <div class="hero-badge">
          <span class="badge-dot"></span>
          PINNED
        </div>
        <h1 class="hero-title">
          <router-link :to="`/post/${pinnedPost.slug || pinnedPost.id}`">
            {{ pinnedPost.title }}
          </router-link>
        </h1>
        <p class="hero-excerpt">{{ pinnedPost.excerpt }}</p>
        <div class="hero-meta">
          <span class="meta-item">
            <span class="meta-label">date</span>
            <span class="meta-value">{{ pinnedPost.date }}</span>
          </span>
          <span class="meta-sep"></span>
          <span class="meta-item">
            <span class="meta-label">read</span>
            <span class="meta-value">{{ pinnedPost.read_time }}</span>
          </span>
          <span class="meta-sep"></span>
          <span class="meta-item">
            <span class="meta-label">tags</span>
            <span class="meta-value">{{ pinnedPost.tag }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- ====== 主体 ====== -->
    <div class="main-layout">
      <!-- 标签过滤提示 -->
      <div v-if="activeTag" class="tag-filter-bar" style="grid-column: 1 / -1; margin-bottom: -28px;">
        <span class="filter-prompt">❯</span>
        <span class="filter-label">filter:</span>
        <span class="filter-tag">#{{ activeTag }}</span>
        <router-link to="/HomePage" class="filter-clear">× clear</router-link>
      </div>

      <!-- 文章列表 — 模块化组件 -->
      <PostList
        :posts="posts"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMore"
        empty-text="暂无文章，稍后再来看看。"
        @load-more="loadMore"
        @refresh="fetchPosts"
      />

      <!-- 侧边栏 — 保持不变 -->
      <aside class="sidebar">
        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">system.info</span>
          </div>
          <div class="panel-body">
            <div class="info-line">
              <span class="info-key">os</span>
              <span class="info-val">blogOS v2.0.1</span>
            </div>
            <div class="info-line">
              <span class="info-key">uptime</span>
              <span class="info-val terminal-green">online</span>
            </div>
            <div class="info-line">
              <span class="info-key">posts</span>
              <span class="info-val">{{ posts.length }} published</span>
            </div>
          </div>
        </div>

        <div v-if="contributors.length" class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-green"></span>
            <span class="panel-dot dot-green dim"></span>
            <span class="panel-title">contributors</span>
          </div>
          <div class="panel-body">
            <router-link
              v-for="c in contributors"
              :key="c.username"
              :to="`/user/${c.username}`"
              class="contributor-item"
            >
              <span class="contributor-avatar">{{ c.username.charAt(0).toUpperCase() }}</span>
              <span class="contributor-name">@{{ c.username }}</span>
              <span class="contributor-count">({{ c.count }})</span>
            </router-link>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-yellow"></span>
            <span class="panel-dot dot-yellow dim"></span>
            <span class="panel-title">tags.index</span>
          </div>
          <div class="panel-body">
            <div class="tag-cloud">
              <router-link
                v-for="tag in tags"
                :key="tag.name"
                :to="`/HomePage?tag=${encodeURIComponent(tag.name)}`"
                class="tag" :class="tag.size"
              >
                #{{ tag.name }}
              </router-link>
              <span v-if="!tags.length" class="no-tags">— no tags yet</span>
            </div>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-purple"></span>
            <span class="panel-dot dot-purple dim"></span>
            <span class="panel-title">links.symlink</span>
          </div>
          <div class="panel-body">
            <a href="https://github.com" target="_blank" class="link-item" v-if="false">
              <span class="link-arrow">→</span> github
            </a>
            <router-link to="/archive" class="link-item">
              <span class="link-arrow">→</span> archive
            </router-link>
          </div>
        </div>
      </aside>
    </div>

    <!-- ====== 页脚 ====== -->
    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">echo "© 2026 woodwhite@blog — a tech forum"</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostList from './PostList.vue'
import { useAuth } from '../../stores/auth.js'

const route = useRoute()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

// ====== 用户菜单 ======
const showUserMenu = ref(false)
const userMenuRef = ref(null)

function handleLogout() {
  showUserMenu.value = false
  logout()
}

function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    showUserMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

// ====== 数据 ======
const posts = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

// ====== 从 posts 聚合标签 ======
const tags = computed(() => {
  const map = {}
  posts.value.forEach(p => {
    if (p.tags) {
      p.tags.forEach(t => {
        const name = typeof t === 'string' ? t : t.name
        if (name) map[name] = (map[name] || 0) + 1
      })
    } else if (p.tag && p.tag !== 'uncategorized') {
      map[p.tag] = (map[p.tag] || 0) + 1
    }
  })
  return Object.entries(map)
    .map(([name, count]) => ({
      name,
      size: count >= 5 ? 'lg' : count >= 3 ? 'md' : count >= 2 ? 'sm' : 'xs',
    }))
    .sort((a, b) => b.name.length - a.name.length || a.name.localeCompare(b.name))
    .slice(0, 12)
})

// ====== 计算属性 ======
const pinnedPost = computed(() => posts.value.find(p => p.is_pinned) || null)
const hasMore = computed(() => currentPage.value < totalPages.value)
const activeTag = computed(() => route.query.tag || '')

// ====== 从 posts 聚合作者发文数 ======
const contributors = computed(() => {
  const map = {}
  posts.value.forEach(p => {
    if (p.author && p.author.username) {
      map[p.author.username] = (map[p.author.username] || 0) + 1
    }
  })
  return Object.entries(map)
    .map(([username, count]) => ({ username, count }))
    .sort((a, b) => b.count - a.count)
})

// ====== 获取文章 ======
async function fetchPosts(page = 1) {
  if (page === 1) loading.value = true
  error.value = ''

  try {
    const tagFilter = route.query.tag || ''
    let url = `/api/posts?page=${page}&status=published`
    if (tagFilter) url += `&tag=${encodeURIComponent(tagFilter)}`

    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) throw new Error(data.message || '请求失败')

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

// ====== 监听 query.tag 变化重新获取 ======
watch(() => route.query.tag, () => {
  fetchPosts(1)
})

// ====== 加载更多 ======
async function loadMore() {
  loadingMore.value = true
  await fetchPosts(currentPage.value + 1)
}

// ====== 搜索（待实现） ======
// function toggleSearch() {}

// ====== 生命周期 ======
onMounted(() => fetchPosts())
</script>

<!-- ====== 样式：只保留 home-page 独有的，PostList 的样式已随组件带走 ====== -->
<style scoped>
:root { color-scheme: dark; }

.home-page {
  min-height: 100vh;
  background: #0a0a0c;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9;
  position: relative;
  overflow-x: hidden;
}

/* 背景 */
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

.nav-links {
  display: flex; gap: 28px; flex: 1;
}

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

/* ====== 用户菜单 ====== */
.user-menu-wrap { position: relative; }

.btn-user {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 10px 4px 4px;
  font-family: inherit; font-size: 12px;
  color: #c9d1d9; background: rgba(255,255,255,0.04);
  border: 1px solid #25262a; border-radius: 8px;
  cursor: pointer; transition: all 0.2s;
}

.btn-user:hover { border-color: #00d4ff; background: rgba(0,212,255,0.06); }

.user-avatar {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: #00d4ff; color: #0a0a0c;
  font-weight: 700; font-size: 12px;
  border-radius: 6px; text-transform: uppercase;
}

.user-name { font-weight: 500; color: #8b9098; }

.user-caret {
  font-size: 10px; color: #484b52; transition: transform 0.2s;
}

.user-caret.open { transform: rotate(180deg); }

.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 180px;
  background: #16171b; border: 1px solid #25262a;
  border-radius: 8px; overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  z-index: 200;
}

.dropdown-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  font-family: inherit; font-size: 12px; font-weight: 500;
  color: #8b9098; background: none; border: none;
  text-decoration: none; cursor: pointer;
  transition: all 0.15s;
}

.dropdown-item.admin-link {
  color: #00d4ff;
  border-bottom: 1px solid #1c1d21;
}
.dropdown-item.admin-link:hover {
  background: rgba(0,212,255,0.06);
}
.dropdown-item.logout:hover { color: #ff5f57; }
.dropdown-icon { font-size: 13px; }

/* ====== Hero ====== */
.hero {
  position: relative; z-index: 1;
  border-bottom: 1px solid #1c1d21;
  background: radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.03) 0%, transparent 60%);
}

.hero-inner {
  max-width: 1060px; margin: 0 auto; padding: 72px 24px 64px;
}

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 10px; font-weight: 700; letter-spacing: 2px;
  color: #6e737a; margin-bottom: 20px; text-transform: uppercase;
}

.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #00d4ff;
  box-shadow: 0 0 8px rgba(0,212,255,0.5);
}

.hero-title {
  font-size: 34px; font-weight: 800; line-height: 1.3;
  margin: 0 0 16px; max-width: 680px; letter-spacing: -0.5px;
}

.hero-title a {
  color: #e6edf3; text-decoration: none; transition: color 0.2s;
}

.hero-title a:hover { color: #00d4ff; }

.hero-excerpt {
  font-size: 15px; color: #6e737a; line-height: 1.7;
  margin: 0 0 24px; max-width: 560px;
}

.hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.meta-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }

.meta-label {
  color: #484b52; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
}

.meta-value { color: #8b9098; }

.meta-sep { width: 1px; height: 12px; background: #1c1d21; }

/* ====== 主体布局 ====== */
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
.dot-purple { background: #a78bfa; }
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

/* ====== 标签过滤提示 ====== */
.tag-filter-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin-bottom: 20px;
  background: rgba(0,212,255,0.04);
  border: 1px solid rgba(0,212,255,0.15);
  border-radius: 6px; font-size: 12px;
}

.filter-prompt { color: #00d4ff; font-weight: 700; }
.filter-label { color: #484b52; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
.filter-tag { color: #00d4ff; font-weight: 600; }
.filter-clear {
  margin-left: auto;
  color: #6e737a; text-decoration: none; font-weight: 600;
  transition: color 0.2s;
}
.filter-clear:hover { color: #ff5f57; }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }

.tag {
  font-size: 11px; padding: 4px 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid #1c1d21; border-radius: 4px;
  color: #6e737a; cursor: pointer; transition: all 0.2s;
  text-decoration: none;
}

.tag:hover { border-color: #00d4ff; color: #00d4ff; background: rgba(0,212,255,0.04); }
.tag.router-link-active { border-color: #00d4ff; color: #00d4ff; }
.tag.lg { font-size: 13px; font-weight: 600; }
.tag.md { font-size: 12px; }
.tag.sm { font-size: 11px; }
.tag.xs { font-size: 10px; opacity: 0.7; }

.link-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; font-size: 11px;
  color: #6e737a; text-decoration: none; transition: color 0.2s;
}

.link-item:hover { color: #00d4ff; }
.link-arrow { color: #484b52; font-weight: 700; }

/* ====== Contributors ====== */
.dot-green { background: #2bd64e; }

.contributor-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 0; font-size: 11px;
  color: #6e737a; text-decoration: none;
  transition: color 0.2s;
}

.contributor-item:hover { color: #00d4ff; }

.contributor-avatar {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,212,255,0.1); color: #00d4ff;
  border-radius: 4px; font-size: 10px; font-weight: 700;
  text-transform: uppercase;
}

.contributor-name { flex: 1; }

.contributor-count {
  font-size: 10px; color: #484b52;
  font-weight: 600;
}

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
  .hero-inner { padding: 48px 20px 40px; }
  .hero-title { font-size: 24px; }
}
</style>