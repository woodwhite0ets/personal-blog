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
          <div class="search-wrap" :class="{ active: searchActive }">
            <button class="btn-search" @click="toggleSearch" title="搜索">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            <input
              v-if="searchActive"
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="搜索文章..."
              @keydown.escape="closeSearch"
              @keydown.enter="doSearch"
            />
          </div>

          <!-- 未登录 -->
          <template v-if="!isLoggedIn">
            <router-link to="/" class="btn-write">
              <span class="btn-write-icon">+</span> 新文章
            </router-link>
          </template>

          <!-- 已登录 -->
          <template v-else>
            <router-link to="/editor" class="btn-write">
              <span class="btn-write-icon">+</span> 新文章
            </router-link>
            <div class="user-menu-wrap" ref="userMenuRef">
              <button class="btn-user" @click="showUserMenu = !showUserMenu">
                <UserAvatar :src="currentUser?.avatar" :alt="(currentUser?.nickname || currentUser?.username || '?')" size="sm" />
                <span class="user-name">@{{ currentUser?.username }}</span>
                <span class="user-caret" :class="{ open: showUserMenu }">▾</span>
              </button>
              <div v-if="showUserMenu" class="user-dropdown">
                <router-link v-if="isAdmin" to="/admin/dashboard" class="dropdown-item admin-link" @click="showUserMenu = false">
                  <span class="dropdown-icon">⚙</span> 管理面板
                </router-link>
                <router-link :to="`/user/${currentUser?.username}`" class="dropdown-item" @click="showUserMenu = false">
                  <span class="dropdown-icon">🏠</span> 我的页面
                </router-link>
                <button class="dropdown-item logout" @click="handleLogout">
                  <span class="dropdown-icon">⏻</span> 退出登录
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
          置顶
        </div>
        <h1 class="hero-title">
          <router-link :to="`/post/${pinnedPost.slug || pinnedPost.id}`">
            {{ pinnedPost.title }}
          </router-link>
        </h1>
        <p class="hero-excerpt">{{ pinnedPost.excerpt }}</p>
        <div class="hero-meta">
          <span class="meta-item">
            <span class="meta-label">日期</span>
            <span class="meta-value">{{ pinnedPost.date }}</span>
          </span>
          <span class="meta-sep"></span>
          <span class="meta-item">
            <span class="meta-label">阅读</span>
            <span class="meta-value">{{ pinnedPost.read_time }}</span>
          </span>
          <span class="meta-sep"></span>
          <span class="meta-item">
            <span class="meta-label">标签</span>
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
        <span class="filter-label">筛选:</span>
        <span class="filter-tag">#{{ activeTag }}</span>
        <router-link :to="clearTagLink" class="filter-clear">× 清除</router-link>
      </div>

      <!-- 搜索过滤提示 -->
      <div v-if="activeSearch" class="tag-filter-bar" style="grid-column: 1 / -1; margin-bottom: -28px;">
        <span class="filter-prompt">❯</span>
        <span class="filter-label">搜索:</span>
        <span class="filter-tag">&quot;{{ activeSearch }}&quot;</span>
        <router-link :to="clearSearchLink" class="filter-clear">× 清除</router-link>
      </div>

      <!-- 排序切换 -->
      <div class="sort-bar">
        <span class="sort-label">排序:</span>
        <button
          class="sort-btn"
          :class="{ active: sortMode === 'latest' }"
          @click="switchSort('latest')"
        >最新</button>
        <button
          class="sort-btn"
          :class="{ active: sortMode === 'popular' }"
          @click="switchSort('popular')"
        >热门</button>
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
            <span class="panel-title">系统.信息</span>
          </div>
          <div class="panel-body">
            <div class="info-line">
              <span class="info-key">系统</span>
              <span class="info-val">博客系统 v2.0.1</span>
            </div>
            <div class="info-line">
              <span class="info-key">运行时间</span>
              <span class="info-val terminal-green">在线</span>
            </div>
            <div class="info-line">
              <span class="info-key">文章</span>
              <span class="info-val">{{ posts.length }} 已发布</span>
            </div>
          </div>
        </div>

        <div v-if="contributors.length" class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-green"></span>
            <span class="panel-dot dot-green dim"></span>
            <span class="panel-title">贡献者</span>
          </div>
          <div class="panel-body">
            <router-link
              v-for="c in contributors"
              :key="c.username"
              :to="`/user/${c.username}`"
              class="contributor-item"
            >
              <UserAvatar :src="c.avatar" :alt="c.username" size="xs" />
              <span class="contributor-name">@{{ c.username }}</span>
              <span class="contributor-count">({{ c.count }})</span>
            </router-link>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-yellow"></span>
            <span class="panel-dot dot-yellow dim"></span>
            <span class="panel-title">标签.索引</span>
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
              <span v-if="!tags.length" class="no-tags">— 暂无标签</span>
            </div>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-purple"></span>
            <span class="panel-dot dot-purple dim"></span>
            <span class="panel-title">链接.符号链接</span>
          </div>
          <div class="panel-body">
            <a href="https://github.com" target="_blank" class="link-item" v-if="false">
              <span class="link-arrow">→</span> github
            </a>
            <router-link to="/archive" class="link-item">
              <span class="link-arrow">→</span> 归档
            </router-link>
          </div>
        </div>
      </aside>
    </div>

    <SiteFooter command='echo "© 2026 woodwhite@blog — 技术论坛"' />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostList from './PostList.vue'
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
import SiteFooter from '../common/SiteFooter.vue'
import UserAvatar from '../common/UserAvatar.vue'
import { useAuth } from '../../stores/auth.js'

const route = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

// ====== 用户菜单 ======
const showUserMenu = ref(false)
const userMenuRef = ref(null)

// ====== 搜索状态 ======
const searchActive = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)

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

// ====== 从 API 获取全站标签 ======
const tags = ref([])

async function fetchTags() {
  try {
    const res = await fetch('/api/tags')
    if (res.ok) {
      const data = await res.json()
      tags.value = (data.tags || []).map(t => ({
        name: t.name,
        size: t.post_count >= 5 ? 'lg' : t.post_count >= 3 ? 'md' : t.post_count >= 2 ? 'sm' : 'xs',
      }))
    }
  } catch { /* ignore */ }
}

// ====== 计算属性 ======
const pinnedPost = computed(() => posts.value.find(p => p.is_pinned) || null)
const hasMore = computed(() => currentPage.value < totalPages.value)
const activeTag = computed(() => route.query.tag || '')
const activeSearch = computed(() => route.query.search || '')

const clearTagLink = computed(() => {
  const query = { ...route.query }
  delete query.tag
  return { path: '/HomePage', query }
})

const clearSearchLink = computed(() => {
  const query = { ...route.query }
  delete query.search
  return { path: '/HomePage', query }
})

// ====== 从 posts 聚合作者发文数 ======
const contributors = computed(() => {
  const map = {}
  posts.value.forEach(p => {
    if (p.author && p.author.username) {
      const key = p.author.username
      if (!map[key]) {
        map[key] = { username: key, avatar: p.author.avatar || '', count: 0 }
      }
      map[key].count++
    }
  })
  return Object.values(map).sort((a, b) => b.count - a.count)
})

const sortMode = ref('latest')

function switchSort(mode) {
  if (sortMode.value === mode) return
  sortMode.value = mode
  fetchPosts(1)
}

// ====== 请求序号守卫（防止快速切换筛选时乱序响应覆盖） ======
let fetchSeq = 0

// ====== 获取文章 ======
async function fetchPosts(page = 1) {
  const mySeq = ++fetchSeq
  if (page === 1) loading.value = true
  error.value = ''

  try {
    const tagFilter = route.query.tag || ''
    const searchFilter = route.query.search || ''
    let url = `/api/posts?page=${page}&status=published&sort=${sortMode.value}`
    if (tagFilter) url += `&tag=${encodeURIComponent(tagFilter)}`
    if (searchFilter) url += `&search=${encodeURIComponent(searchFilter)}`

    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok) throw new Error(data.message || '请求失败')

    // 丢弃过期响应（已有更新的请求发出）
    if (mySeq !== fetchSeq) return

    if (page === 1) {
      posts.value = data.posts
    } else {
      // loadMore 期间若筛选已变化，丢弃旧筛选的追加
      if (mySeq !== fetchSeq) return
      posts.value.push(...data.posts)
    }

    currentPage.value = data.page
    totalPages.value = data.totalPages
  } catch (e) {
    if (mySeq !== fetchSeq) return
    error.value = e.message || '获取文章失败'
  } finally {
    if (mySeq === fetchSeq) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

// ====== 监听 query.tag 变化重新获取 ======
watch(() => route.query.tag, () => {
  fetchPosts(1)
})

// ====== 监听 query.search 变化重新获取 ======
watch(() => route.query.search, () => {
  fetchPosts(1)
})

// ====== 加载更多 ======
async function loadMore() {
  loadingMore.value = true
  await fetchPosts(currentPage.value + 1)
}

// ====== 搜索 ======
function toggleSearch() {
  searchActive.value = !searchActive.value
  if (searchActive.value) {
    searchQuery.value = activeSearch.value
    nextTick(() => searchInput.value?.focus())
  }
}

function closeSearch() {
  searchActive.value = false
  searchQuery.value = ''
}

function doSearch() {
  const query = { ...route.query }
  if (searchQuery.value.trim()) {
    query.search = searchQuery.value.trim()
  } else {
    delete query.search
  }
  router.push({ path: '/HomePage', query })
  searchActive.value = false
}

// ====== 生命周期 ======
onMounted(() => { fetchPosts(); fetchTags() })
</script>

<!-- ====== 样式：只保留 home-page 独有的，PostList 的样式已随组件带走 ====== -->
<style scoped>
:root { color-scheme: dark; }

.home-page {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

/* 背景 */
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
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    var(--scanline) 2px, var(--scanline) 4px
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
  background: var(--navbar-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}

.brand {
  display: flex; align-items: baseline; gap: 4px;
  text-decoration: none; font-size: 14px; font-weight: 600;
}

.brand-bracket { color: var(--text-muted); }
.brand-text { color: var(--accent); }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }

.nav-links {
  display: flex; gap: 28px; flex: 1;
}

.nav-links a {
  display: flex; align-items: center; gap: 6px;
  text-decoration: none; font-size: 12px; font-weight: 500;
  color: var(--text-dim); transition: color 0.2s; letter-spacing: 0.5px;
}

.nav-num { color: var(--text-faint); font-size: 10px; font-weight: 700; }

.nav-links a:hover,
.nav-links a.router-link-active { color: var(--text); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }

.nav-actions { display: flex; align-items: center; gap: 12px; }

.btn-search {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--border-strong); border-radius: 6px;
  color: var(--text-dim); cursor: pointer; transition: all 0.2s;
}

.btn-search:hover { border-color: var(--accent); color: var(--accent); }

/* ====== 搜索输入框 ====== */
.search-wrap {
  display: flex; align-items: center; gap: 0;
  position: relative;
}

.search-wrap.active .btn-search {
  border-right: none;
  border-radius: 6px 0 0 6px;
  border-color: var(--accent); color: var(--accent);
}

.search-input {
  width: 200px; height: 34px;
  padding: 0 12px;
  background: var(--bg-elevated); border: 1px solid var(--border-strong); border-left: none;
  border-radius: 0 6px 6px 0;
  color: var(--text);
  font-family: inherit; font-size: 12px;
  caret-color: var(--accent);
  outline: none;
  animation: searchSlideIn 0.2s ease;
}

.search-input:focus { border-color: var(--accent); }

.search-input::placeholder { color: var(--text-faint); }

@keyframes searchSlideIn {
  from { width: 0; opacity: 0; }
  to { width: 200px; opacity: 1; }
}

.btn-write {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 16px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: var(--on-accent); background: var(--accent); border-radius: 6px;
  text-decoration: none; transition: all 0.2s;
}

.btn-write:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 20px var(--accent-a25);
  transform: translateY(-1px);
}

.btn-write-icon { font-size: 15px; font-weight: 700; }

/* ====== 用户菜单 ====== */
.user-menu-wrap { position: relative; }

.btn-user {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 10px 4px 4px;
  font-family: inherit; font-size: 12px;
  color: var(--text); background: var(--overlay-a4);
  border: 1px solid var(--border-strong); border-radius: 8px;
  cursor: pointer; transition: all 0.2s;
}

.btn-user:hover { border-color: var(--accent); background: var(--accent-a6); }

.user-avatar {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent); color: var(--on-accent);
  font-weight: 700; font-size: 12px;
  border-radius: 6px; text-transform: uppercase;
}

.user-name { font-weight: 500; color: var(--text-secondary); }

.user-caret {
  font-size: 10px; color: var(--text-muted); transition: transform 0.2s;
}

.user-caret.open { transform: rotate(180deg); }

.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 180px;
  background: var(--bg-float); border: 1px solid var(--border-strong);
  border-radius: 8px; overflow: hidden;
  box-shadow: 0 12px 40px var(--shadow);
  z-index: 200;
}

.dropdown-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  font-family: inherit; font-size: 12px; font-weight: 500;
  color: var(--text-secondary); background: none; border: none;
  text-decoration: none; cursor: pointer;
  transition: all 0.15s;
}

.dropdown-item.admin-link {
  color: var(--accent);
  border-bottom: 1px solid var(--border);
}
.dropdown-item.admin-link:hover {
  background: var(--accent-a6);
}
.dropdown-item.logout:hover { color: var(--err); }
.dropdown-icon { font-size: 13px; }

/* ====== Hero ====== */
.hero {
  position: relative; z-index: 1;
  border-bottom: 1px solid var(--border);
  background: radial-gradient(ellipse at 50% 0%, var(--accent-a3) 0%, transparent 60%);
}

.hero-inner {
  max-width: 1060px; margin: 0 auto; padding: 72px 24px 64px;
}

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 10px; font-weight: 700; letter-spacing: 2px;
  color: var(--text-dim); margin-bottom: 20px; text-transform: uppercase;
}

.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-a50);
}

.hero-title {
  font-size: 34px; font-weight: 800; line-height: 1.3;
  margin: 0 0 16px; max-width: 680px; letter-spacing: -0.5px;
}

.hero-title a {
  color: var(--text-bright); text-decoration: none; transition: color 0.2s;
}

.hero-title a:hover { color: var(--accent); }

.hero-excerpt {
  font-size: 15px; color: var(--text-dim); line-height: 1.7;
  margin: 0 0 24px; max-width: 560px;
}

.hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.meta-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }

.meta-label {
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
}

.meta-value { color: var(--text-secondary); }

.meta-sep { width: 1px; height: 12px; background: var(--border); }

/* ====== 主体布局 ====== */
.main-layout {
  position: relative; z-index: 1;
  max-width: 1060px; margin: 0 auto; padding: 56px 24px;
  display: grid; grid-template-columns: 1fr 280px; gap: 56px;
}

/* ====== 侧边栏 ====== */
.sidebar { display: flex; flex-direction: column; gap: 20px; }

.sidebar-panel {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}

.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: var(--accent); }
.dot-yellow { background: var(--warn); }
.dot-purple { background: var(--purple); }
.dim { opacity: 0.3; }

.panel-title {
  flex: 1; font-size: 10px; font-weight: 600;
  color: var(--text-muted); text-align: center;
  letter-spacing: 1.5px; text-transform: lowercase;
}

.panel-body { padding: 14px 16px; }

.info-line {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 11px;
}

.info-key {
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
}

.info-val { color: var(--text-secondary); }
.terminal-green { color: var(--ok); }

/* ====== 标签过滤提示 ====== */
.tag-filter-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin-bottom: 20px;
  background: var(--accent-a4);
  border: 1px solid var(--accent-a15);
  border-radius: 6px; font-size: 12px;
}

.sort-bar {
  grid-column: 1 / -1;   /* 横跨左右两列，避免与 sidebar 并排错位 */
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: var(--accent-a4);
  border: 1px solid var(--accent-a15);
  border-radius: 6px;
}
.sort-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
  color: var(--text-muted);
}
.sort-btn {
  padding: 4px 12px;
  font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--text-dim); background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 4px;
  cursor: pointer; transition: all 0.2s;
}
.sort-btn:hover { border-color: var(--accent-a30); color: var(--text); }
.sort-btn.active {
  color: var(--on-accent); background: var(--accent);
  border-color: var(--accent);
}


.filter-prompt { color: var(--accent); font-weight: 700; }
.filter-label { color: var(--text-muted); text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
.filter-tag { color: var(--accent); font-weight: 600; }
.filter-clear {
  margin-left: auto;
  color: var(--text-dim); text-decoration: none; font-weight: 600;
  transition: color 0.2s;
}
.filter-clear:hover { color: var(--err); }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }

.tag {
  font-size: 11px; padding: 4px 10px;
  background: var(--overlay-a3);
  border: 1px solid var(--border); border-radius: 4px;
  color: var(--text-dim); cursor: pointer; transition: all 0.2s;
  text-decoration: none;
}

.tag:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-a4); }
.tag.router-link-active { border-color: var(--accent); color: var(--accent); }
.tag.lg { font-size: 13px; font-weight: 600; }
.tag.md { font-size: 12px; }
.tag.sm { font-size: 11px; }
.tag.xs { font-size: 10px; opacity: 0.7; }

.link-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; font-size: 11px;
  color: var(--text-dim); text-decoration: none; transition: color 0.2s;
}

.link-item:hover { color: var(--accent); }
.link-arrow { color: var(--text-muted); font-weight: 700; }

/* ====== Contributors ====== */
.dot-green { background: var(--ok); }

.contributor-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 0; font-size: 11px;
  color: var(--text-dim); text-decoration: none;
  transition: color 0.2s;
}

.contributor-item:hover { color: var(--accent); }

.contributor-avatar {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-a10); color: var(--accent);
  border-radius: 4px; font-size: 10px; font-weight: 700;
  text-transform: uppercase;
}

.contributor-name { flex: 1; }

.contributor-count {
  font-size: 10px; color: var(--text-muted);
  font-weight: 600;
}

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .main-layout { grid-template-columns: 1fr; gap: 48px; }
  .nav-links { display: none; }
  .hero-inner { padding: 48px 20px 40px; }
  .hero-title { font-size: 24px; }
}
</style>