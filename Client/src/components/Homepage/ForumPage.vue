<template>
  <div class="forum-page">

    <span class="edge-label" aria-hidden="true">文章 · woodwhite@blog</span>

    <!-- ====== 导航栏 ====== -->
    <SiteNav>
  <template #search>
<div class="search-wrap" :class="{ active: searchActive }">
            <button class="btn btn-icon btn-search" type="button" aria-label="搜索文章" title="搜索" @click="toggleSearch">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
            <input
              v-if="searchActive"
              ref="searchInput"
              v-model="searchQuery" name="search"
              type="text"
              class="search-input"
              placeholder="搜索帖子…"
              @keydown.escape="closeSearch"
              @keydown.enter="doSearch"
            />
          </div>
  </template>
</SiteNav>

    <!-- ====== Hero：论坛介绍 ====== -->
    <section class="ed-hero deco-hero">
      <h1 class="ed-hero-title">文章</h1>
      <p class="ed-hero-excerpt">写全栈开发、系统架构与开源实践，这里有全部文章。</p>
    </section>

    <!-- ====== 主体 ====== -->
    <div class="main-layout">
      <main class="forum-main">
      <!-- 标签过滤提示 -->
      <div v-if="activeTag" class="tag-filter-bar" >
        
        <span class="filter-label">筛选:</span>
        <span class="filter-tag">#{{ activeTag }}</span>
        <router-link :to="clearTagLink" class="filter-clear">× 清除</router-link>
      </div>

      <!-- 搜索过滤提示 -->
      <div v-if="activeSearch" class="tag-filter-bar" >
        
        <span class="filter-label">搜索:</span>
        <span class="filter-tag">&quot;{{ activeSearch }}&quot;</span>
        <router-link :to="clearSearchLink" class="filter-clear">× 清除</router-link>
      </div>

      <!-- 排序切换 -->
      <div class="sort-bar">
        <span class="sort-count meta-mono">共 {{ totalPosts }} 篇</span>
        <span class="sub-nav">
          <router-link class="sub-nav-link meta-mono" to="/tags">按分类</router-link>
          <router-link class="sub-nav-link meta-mono" to="/archive">按时间</router-link>
        </span>
        <div class="sort-group">
          <span class="sort-label">排序</span>
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
      </div>
        <!-- 编辑式条目列表 -->
      <div v-if="loading" class="state-box" role="status" aria-live="polite">正在加载…</div>
      <div v-else-if="error" class="state-box error" role="alert">{{ error }}</div>
      <div v-else-if="!posts.length" class="state-box" aria-live="polite">暂无文章。</div>
      <template v-else>
        <article v-for="(p, i) in posts" :key="p.id" class="ed-entry" :class="{ 'is-featured': i === 0 && isDefaultView }">
          <span class="deco-idx meta-mono">{{ String(i + 1).padStart(2, '0') }}</span>
          <div class="ed-entry-body">
            <h3 class="ed-entry-title">
              <router-link :to="`/post/${p.slug || p.id}`" class="deco-link"><template
                v-for="(seg, k) in hl(p.title)" :key="`t${k}`"
              ><mark v-if="seg.m" class="hl-hit">{{ seg.t }}</mark><template v-else>{{ seg.t }}</template></template></router-link>
            </h3>
            <p class="ed-entry-excerpt"><template
              v-for="(seg, k) in hl(excerptOf(p))" :key="`e${k}`"
            ><mark v-if="seg.m" class="hl-hit">{{ seg.t }}</mark><template v-else>{{ seg.t }}</template></template></p>
            <p class="ed-entry-meta"><time>{{ p.date }}</time><span class="meta-minor">{{ readLabel(p) }} · {{ p.views || 0 }} 次浏览</span></p>
          </div>
        </article>
        <button v-if="hasMore" class="ed-more-btn" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中…' : '加载更多' }}
        </button>
      </template>

      </main>

      <!-- 侧边栏 -->
      <aside class="sidebar">
        <div v-if="contributors.length" class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-title deco-rule">作者</span>
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
              <span class="contributor-count">{{ c.count }} 篇</span>
            </router-link>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-title deco-rule">标签</span>
          </div>
          <div class="panel-body">
            <div class="tag-cloud">
              <router-link
                v-for="tag in tags"
                :key="tag.name"
                :to="`/forum?tag=${encodeURIComponent(tag.name)}`"
                class="tag" :class="[tag.size, { selected: activeTag === tag.name }]"
              >
                #{{ tag.name }}
              </router-link>
              <span v-if="!tags.length" class="no-tags">— 暂无标签</span>
            </div>
          </div>
        </div>

      </aside>
      <span class="deco-end" aria-hidden="true" style="grid-column: 1 / -1"></span>
    </div>

    <SiteFooter command='echo "© 2026 woodwhite@blog — 社区论坛"' />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { stripMarkdown } from '../../utils/excerpt.js'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import UserAvatar from '../common/UserAvatar.vue'
import { useAuth } from '../../stores/auth.js'

const route = useRoute()

// 后端给的是 "2 min read" 这类英文，页面统一成中文
// 摘要开头常常重复标题（文章第一段就是标题），按字符逐位比对后剥掉
const excerptOf = (p) => {
  const raw = String(stripMarkdown(p.excerpt, 180) || '')
  const title = String(p.title || '').replace(/\s+/g, '')
  let idx = 0
  let matched = 0
  while (idx < raw.length && matched < title.length) {
    const ch = raw[idx]
    if (!/\s/.test(ch)) {
      if (ch !== title[matched]) break
      matched += 1
    }
    idx += 1
  }
  const rest = matched === title.length && title.length > 0
    ? raw.slice(idx).replace(/^[\s:：,，。—\-、]+/, '')
    : raw
  // 摘要里残留的双破折号换成逗号（正文存量数据里有）
  return rest.replace(/——/g, '，').replace(/\s+/g, ' ').trim()
}

const readLabel = (p) => {
  const m = String(p.read_time || '').match(/(\d+)/)
  return m ? `${m[1]} 分钟` : '短读'
}
const navOpen = ref(false)
const router = useRouter()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

// ====== 用户菜单 ======
const showUserMenu = ref(false)
const userMenuRef = ref(null)

// ====== 搜索状态 ======
const searchActive = ref(false)
const searchQuery = ref('')

// 搜索结果里把命中的词标出来（后端已在排序上让标题命中靠前，这里补可见性）
function hl(text) {
  const term = searchQuery.value.trim()
  const src = String(text || '')
  if (!term) return [{ t: src, m: false }]
  const lower = src.toLowerCase()
  const lt = term.toLowerCase()
  const out = []
  let i = 0
  while (i < src.length) {
    const j = lower.indexOf(lt, i)
    if (j < 0) { out.push({ t: src.slice(i), m: false }); break }
    if (j > i) out.push({ t: src.slice(i, j), m: false })
    out.push({ t: src.slice(j, j + term.length), m: true })
    i = j + term.length
  }
  return out.filter((x) => x.t)
}
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
const totalPosts = ref(0)

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

// ====== 论坛活跃用户 ======
const contributors = ref([])

async function fetchContributors() {
  try {
    const res = await fetch('/api/authors')
    if (res.ok) {
      const data = await res.json()
      contributors.value = (data.authors || []).map(a => ({
        username: a.username,
        avatar: a.avatar || '',
        count: a.post_count,
      }))
    }
  } catch { /* ignore */ }
}

// ====== 计算属性 ======
const hasMore = computed(() => currentPage.value < totalPages.value)
const activeTag = computed(() => route.query.tag || '')
const activeSearch = computed(() => route.query.search || '')
// 默认视图（无筛选无搜索、按最新排序）才突出首篇
const isDefaultView = computed(() => sortMode.value === 'latest' && !activeTag.value && !activeSearch.value)

const clearTagLink = computed(() => {
  const query = { ...route.query }
  delete query.tag
  return { path: '/forum', query }
})

const clearSearchLink = computed(() => {
  const query = { ...route.query }
  delete query.search
  return { path: '/forum', query }
})

// 排序进 URL：?sort=popular 可分享、刷新不丢
const sortMode = ref(route.query.sort === 'popular' ? 'popular' : 'latest')

function switchSort(mode) {
  if (sortMode.value === mode) return
  sortMode.value = mode
  const query = { ...route.query }
  if (mode === 'latest') delete query.sort; else query.sort = mode
  router.replace({ query })
  fetchPosts(1)
}

// ====== 请求序号守卫 ======
let fetchSeq = 0

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

    if (mySeq !== fetchSeq) return

    if (page === 1) {
      posts.value = data.posts
    } else {
      if (mySeq !== fetchSeq) return
      posts.value.push(...data.posts)
    }

    currentPage.value = data.page
    totalPages.value = data.totalPages
    totalPosts.value = data.total
  } catch (e) {
    if (mySeq !== fetchSeq) return
    error.value = e.message || '获取帖子失败'
  } finally {
    if (mySeq === fetchSeq) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

watch(() => route.query.tag, () => { fetchPosts(1) })
watch(() => route.query.search, () => { fetchPosts(1) })

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
  router.push({ path: '/forum', query })
  searchActive.value = false
}

onMounted(() => { fetchPosts(); fetchTags(); fetchContributors() })
</script>

<style scoped>
:root { color-scheme: dark; }

.forum-page {
  min-height: 100dvh;
  background: var(--bg);
  font-family: var(--font-sans);
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
  text-decoration: none; font-size: 0.875rem; font-weight: 600;
}

.brand-bracket { color: var(--text-muted); }
.brand-text { color: var(--accent); }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 0.75rem; }

.nav-links {
  display: flex; gap: 28px; flex: 1;
}

.nav-links a {
  display: flex; align-items: center; gap: 6px;
  text-decoration: none; font-size: 0.75rem; font-weight: 500;
  color: var(--text-dim); transition: color 0.2s; letter-spacing: 0.5px;
}

.nav-num { color: var(--text-faint); font-size: 0.625rem; font-weight: 700; }

.nav-links a:hover,
.nav-links a.router-link-active { color: var(--text); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }

.nav-actions { display: flex; align-items: center; gap: 12px; }
.nav-toggle { display: none; position: relative; z-index: 120; flex-direction: column; justify-content: center; align-items: center; gap: 4px; width: 34px; height: 34px; background: none; border: 1px solid var(--border-strong); border-radius: 6px; cursor: pointer; padding: 0; }
.nav-toggle span { display: block; width: 16px; height: 2px; background: var(--text-dim); border-radius: 1px; transition: transform 0.2s, opacity 0.2s; }
.nav-toggle.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.nav-toggle.open span:nth-child(2) { opacity: 0; }
.nav-toggle.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

.btn-search {
  border-color: var(--border-strong);
  color: var(--text-dim);
}

.btn-search:hover { border-color: var(--accent); color: var(--accent); }

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
  font-family: inherit; font-size: 0.75rem;
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
  font-family: inherit; font-size: 0.75rem; font-weight: 600;
  color: var(--on-accent); background: var(--accent); border-radius: 6px;
  text-decoration: none; transition: color 0.2s, background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.2s, box-shadow 0.2s;
}

.btn-write:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 20px var(--accent-a25);
  transform: translateY(-1px);
}

.btn-write-icon { font-size: 0.9375rem; font-weight: 700; }

/* ====== 用户菜单 ====== */
.user-menu-wrap { position: relative; }

.btn-user {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 10px 4px 4px;
  font-family: inherit; font-size: 0.75rem;
  color: var(--text); background: var(--overlay-a4);
  border: 1px solid var(--border-strong); border-radius: 8px;
  cursor: pointer; transition: color 0.2s, background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.2s, box-shadow 0.2s;
}

.btn-user:hover { border-color: var(--accent); background: var(--accent-a6); }

.user-name { font-weight: 500; color: var(--text-secondary); }

.user-caret {
  font-size: 0.625rem; color: var(--text-muted); transition: transform 0.2s;
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
  font-family: inherit; font-size: 0.75rem; font-weight: 500;
  color: var(--text-secondary); background: none; border: none;
  text-decoration: none; cursor: pointer;
  transition: color 0.15s, background-color 0.15s, border-color 0.15s, opacity 0.15s, transform 0.15s, box-shadow 0.15s;
}

.dropdown-item.admin-link {
  color: var(--accent);
  border-bottom: 1px solid var(--border);
}
.dropdown-item.admin-link:hover {
  background: var(--accent-a6);
}
.dropdown-item.logout:hover { color: var(--err); }
.dropdown-icon { font-size: 0.8125rem; }

/* ====== Hero ====== */
.hero {
  position: relative; z-index: 1;
  border-bottom: 1px solid var(--border);
  background:
    radial-gradient(ellipse at 50% 0%, var(--aurora-1) 0%, transparent 65%),
    radial-gradient(ellipse at 15% 10%, var(--aurora-2) 0%, transparent 50%),
    radial-gradient(ellipse at 85% 10%, var(--aurora-3) 0%, transparent 50%);
}

.hero-inner {
  max-width: 1060px; margin: 0 auto; padding: 56px 24px 48px;
  text-align: center;
}

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 0.625rem; font-weight: 700; letter-spacing: 2px;
  color: var(--text-dim); margin-bottom: 16px; text-transform: uppercase;
}

.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-a50);
}

.hero-title {
  font-size: 1.75rem; font-weight: 800; line-height: 1.3;
  margin: 0 0 12px; letter-spacing: -0.5px;
  color: var(--text-bright);
}

.hero-excerpt {
  font-size: 0.875rem; color: var(--text-dim); line-height: 1.7;
  margin: 0 auto 24px; max-width: 500px;
}

.btn-hero-write {
  padding: 10px 24px;
  transition: transform 0.2s;
}

.btn-hero-write:hover {
  box-shadow: 0 0 24px var(--accent-a25);
  transform: translateY(-1px);
}

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
  padding: 0 0 8px;
  background: none;
  border-bottom: 1px dotted var(--rule-dot-ink);
}

.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: var(--accent); }
.dot-yellow { background: var(--warn); }
.dot-purple { background: var(--purple); }
.dim { opacity: 0.3; }

.panel-title {
  flex: 1; font-size: 0.6875rem; font-weight: 600;
  color: var(--text-secondary); text-align: left;
  letter-spacing: .1em; text-transform: none;
  font-family: var(--font-mono);
}

.panel-body { padding: 12px 0 0; }

.info-line {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 0.6875rem;
}

.info-key {
  font-family: var(--font-mono); color: var(--text-faint); letter-spacing: .06em; font-weight: 600;
}

.info-val { color: var(--text-secondary); }
.terminal-green { color: var(--ok); }

/* ====== 标签过滤提示 ====== */
.tag-filter-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin-bottom: 20px;
  background: transparent;
  border-bottom: 1px dotted var(--rule-dot-ink);
  border-top: none; border-left: none; border-right: none;
  border-radius: 6px; font-size: 0.75rem;
}

.sort-bar {
  grid-column: 1 / -1;
  display: flex; align-items: center; gap: 14px;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: transparent;
  border-bottom: 1px dotted var(--rule-dot-ink);
  border-top: none; border-left: none; border-right: none;
  border-radius: 6px;
}
.sort-label {
  font-size: 0.625rem; text-transform: uppercase; letter-spacing: 1px;
  color: var(--text-muted);
}
.sort-btn {
  padding: 4px 12px;
  font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600; letter-spacing: .06em;
  color: var(--text-dim); background: transparent;
  border: 1px solid var(--border); border-radius: 3px;
  cursor: pointer; transition: color var(--dur-hover) var(--ease-out), border-color var(--dur-hover) var(--ease-out);
}
.sort-btn:hover { border-color: var(--border-strong); color: var(--text); }
.sort-btn.active { color: var(--text-bright); border-color: var(--text-bright); background: transparent; }

.filter-prompt { font-family: var(--font-mono); color: var(--text-faint); font-weight: 600; letter-spacing: .06em; }
.filter-label { color: var(--text-muted); text-transform: uppercase; font-size: 0.625rem; letter-spacing: 1px; }
.filter-tag { color: var(--accent); font-weight: 600; }
.filter-clear {
  margin-left: auto;
  color: var(--text-dim); text-decoration: none; font-weight: 600;
  transition: color 0.2s;
}
.filter-clear:hover { color: var(--err); }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }

.tag {
  font-size: 0.6875rem; padding: 4px 11px;
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  color: var(--text-secondary); cursor: pointer;
  transition: color var(--dur-hover) var(--ease-out), border-color var(--dur-hover) var(--ease-out);
  text-decoration: none;
}

.tag:hover { color: var(--text-bright); border-color: var(--text-bright); }
.tag.selected { border-color: var(--text-bright); color: var(--text-bright); }
.tag.lg { font-size: 0.8125rem; font-weight: 600; }
.tag.md { font-size: 0.75rem; }
.tag.sm { font-size: 0.6875rem; }
.tag.xs { font-size: 0.625rem; opacity: 0.7; }

.link-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; font-size: 0.6875rem;
  color: var(--text-dim); text-decoration: none; transition: color 0.2s;
}

.link-item:hover { color: var(--accent); }
.link-arrow { color: var(--text-muted); font-weight: 700; }

/* ====== Contributors ====== */
.dot-green { background: var(--ok); }

.contributor-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 0; font-size: 0.6875rem;
  color: var(--text-dim); text-decoration: none;
  transition: color 0.2s;
}

.contributor-item:hover { color: var(--accent); }

.contributor-name { flex: 1; }

.contributor-count {
  font-size: 0.625rem; color: var(--text-muted);
  font-weight: 600;
}

.no-tags {
  font-size: 0.6875rem; color: var(--text-muted);
}

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .main-layout { grid-template-columns: 1fr; gap: 48px; }
  .nav-links { display: none; }
  .nav-toggle { display: flex; }
  .nav-actions { gap: 8px; }
  .search-input { width: 130px; }
  .user-name { display: none; }
  .user-caret { display: none; }
  .nav-links.open { display: flex; position: fixed; top: 0; right: 0; bottom: 0; width: min(78vw, 300px); flex-direction: column; align-items: stretch; gap: 0; background: var(--bg); border-left: 1px solid var(--border); padding: 72px 20px 24px; z-index: 95; box-shadow: -8px 0 24px var(--shadow-soft); }
  .nav-links.open::before { content: ''; position: fixed; inset: 0; background: var(--modal-overlay); z-index: -1; }
  .nav-links.open a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
  .hero-inner { padding: 40px 20px 36px; }
  .hero-title { font-size: 1.375rem; }
}

/* 信笺统一：侧栏改为无卡片发丝线块（与首页右栏一致）*/
.sidebar { gap: 0; }
.sidebar-panel { background: transparent; border: none; border-bottom: 1px dotted var(--rule-dot-ink); border-radius: 0; box-shadow: none; padding: 0 0 24px; margin-bottom: 24px; }
.sidebar-panel:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
.panel-bar { border-bottom: none; background: transparent; padding: 0 0 12px; }
.panel-body { padding: 0; }
.panel-title { font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600; letter-spacing: .1em; text-transform: none; color: var(--text-secondary); }
.info-key { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .04em; color: var(--text-faint); }

/* 排序 / 筛选：去掉色块，改发丝线行 */
.sort-bar { background: transparent; border: none; border-bottom: 1px solid var(--border); border-radius: 0; padding: 0 0 14px; margin-bottom: 24px; }
.tag-filter-bar { background: transparent; border: none; border-bottom: 1px solid var(--border); border-radius: 0; padding: 0 0 12px; margin-bottom: 20px; }

/* 列表页容器 1200：与 .ed-hero 同宽，标题与列表左边缘对齐 */
.main-layout { max-width: 1200px; padding: 48px 24px 96px; grid-template-columns: minmax(0, 1fr) 288px; gap: 56px; }

/* 单栏断点必须写在本规则之后：此前的同名媒体查询被它覆盖，
   导致 ≤800px 仍是「118px 正文 + 288px 侧栏」的两栏布局。 */
@media (max-width: 800px) {
  .main-layout { grid-template-columns: minmax(0, 1fr); gap: 40px; padding: 40px 24px 72px; }
  .deco-end { display: none; }
}

/* 统一：页面标题手写 40px */
.hero-title { font-family: var(--font-hand); font-size: 2.5rem; font-weight: 400; }
/* 排序工具栏：左侧计数 + 右侧排序组（2026-10-19） */
.sort-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 0 16px; margin-bottom: 20px;
  border-bottom: 1px solid var(--border);
}
.sort-count { font-size: 0.8125rem; color: var(--text-dim); font-variant-numeric: tabular-nums; }
.sort-group { display: flex; align-items: center; gap: 8px; margin-left: auto; }


/* 搜索命中高亮 */
.hl-hit {
  background: color-mix(in srgb, var(--accent) 24%, transparent);
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}
</style>
