<template>
  <div class="home-page">

    <!-- ====== 导航栏 ====== -->
    <SiteNav>
  <template #search>
    <div class="search-wrap" :class="{ active: searchActive }">
      <button class="btn btn-icon btn-search" @click="toggleSearch" title="搜索">
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
  </template>
</SiteNav>

    <!-- ====== Hero：置顶文章 ====== -->
    <section v-if="pinnedPost" class="hero anim-fade-up">
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
      <button class="hero-scroll-hint" @click="scrollToPosts" aria-label="向下滚动查看文章">
        <span class="hint-dot"></span>
        <span class="hint-label">scroll</span>
      </button>
    </section>

    <!-- ====== 个人介绍 ====== -->
    <section class="intro-strip anim-fade-up">
      <div class="intro-avatar"><UserAvatar alt="WoodWhite" size="xl" /></div>
      <div class="intro-body">
        <h2 class="intro-name">WoodWhite</h2>
        <p class="intro-role">应届毕业生 · Web 全栈开发</p>
        <p class="intro-text">本科应届生，主修 Web 前端与全栈开发，熟悉 Vue 3、Node.js、MySQL 等技术栈。持续学习、乐于分享，希望在实践中不断成长。</p>
        <div class="intro-links">
          <router-link to="/about" class="intro-link">关于我</router-link>
          <router-link to="/forum" class="intro-link">文章</router-link>
          <router-link to="/archive" class="intro-link">归档</router-link>
        </div>
      </div>
    </section>

    <!-- ====== 主体 ====== -->
    <!-- ====== 项目 ====== -->
    <section class="home-projects anim-fade-up">
      <h2 class="home-projects-title">项目</h2>
      <ul class="project-list">
        <li class="project-row">
          <h3 class="project-name">woodwhite@blog</h3>
          <p class="project-desc">本站 —— 基于 Vue 3 + Express + MySQL 的全栈技术博客，含认证、文章、评论、点赞与管理后台。</p>
          <div class="project-tags"><span>Vue 3</span><span>Express 5</span><span>MySQL</span></div>
        </li>
        <li class="project-row">
          <h3 class="project-name">mcp-gateway</h3>
          <p class="project-desc">面向个人知识库与服务器管理的 MCP 网关，把知识检索、文档读取与基础运维统一提供给 AI 客户端。</p>
          <div class="project-tags"><span>PostgreSQL</span><span>pgvector</span><span>MCP</span></div>
        </li>
        <li class="project-row">
          <h3 class="project-name">乐清市充电桩分布图</h3>
          <p class="project-desc">充电桩分布与检定监管系统，经历从单体 SQLite 到 Docker + PostGIS 的架构升级。</p>
          <div class="project-tags"><span>Docker</span><span>PostGIS</span><span>地理可视化</span></div>
        </li>
      </ul>
      <router-link to="/about" class="view-all">查看全部项目</router-link>
    </section>

    <SiteFooter command='echo "© 2026 woodwhite@blog — 技术论坛"' />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import UserAvatar from '../common/UserAvatar.vue'
import { useAuth } from '../../stores/auth.js'
import { usePosts } from '../../composables/usePosts.js'

const route = useRoute()
const navOpen = ref(false)
const router = useRouter()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

// ====== 文章数据层（取数/分页/筛选/搜索/标签/作者统计） ======
const {
  posts, loading, loadingMore, error, currentPage, totalPages,
  tags, contributors, totalPublished, sortMode,
  pinnedPost, hasMore, activeTag, activeSearch,
  clearTagLink, clearSearchLink,
  switchSort, loadMore, fetchPosts,
} = usePosts()

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

function scrollToPosts() {
  document.querySelector('.main-layout')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

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


// ====== 实时时钟 ======
const now = ref('')
let clockTimer = null
function tickClock() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  now.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
tickClock()
clockTimer = setInterval(tickClock, 1000)
onUnmounted(() => { if (clockTimer) clearInterval(clockTimer) })
</script>

<!-- ====== 样式：只保留 home-page 独有的，PostList 的样式已随组件带走 ====== -->
<style scoped>
:root { color-scheme: dark; }

.home-page {
  min-height: 100vh;
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
  background:
    radial-gradient(ellipse at 20% 0%, var(--aurora-1) 0%, transparent 45%),
    radial-gradient(ellipse at 80% 0%, var(--aurora-2) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 0%, var(--aurora-3) 0%, transparent 60%);
  background-size: 200% 200%, 200% 200%, 200% 200%;
  animation: heroDrift 12s ease-in-out infinite;
}
@keyframes heroDrift {
  0%, 100% { background-position: 0% 0%, 100% 0%, 50% 0%; }
  50%      { background-position: 40% 0%, 60% 20%, 50% 10%; }
}

.hero-inner {
  max-width: 1060px; margin: 0 auto; padding: 104px 24px 84px;
}

.hero-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-hand); font-size: 14px; font-weight: 400; letter-spacing: 0;
  color: var(--text-dim); margin-bottom: 26px;
}

.badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent-a50);
  animation: pulseGlow 2.2s ease-in-out infinite;
}

.hero-terminal {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-mono); font-size: 12px;
  color: var(--text-dim); margin: -6px 0 30px;
  padding: 7px 15px; border-radius: 999px;
  background: var(--overlay-a2); border: 1px solid var(--border);
}
.hero-prompt { color: var(--accent); }
.hero-caret { color: var(--accent); animation: caretBlink 1s step-end infinite; }

.hero-title {
  font-family: var(--font-hand);
  font-size: clamp(34px, 4.6vw, 54px); font-weight: 400; line-height: 1.42;
  margin: 0 0 22px; max-width: 780px; letter-spacing: 0;
}

.hero-title a {
  color: var(--text-bright); text-decoration: none; transition: color 0.2s;
}

.hero-title a:hover { color: var(--accent); }

.hero-excerpt {
  font-size: 17px; color: var(--text-dim); line-height: 1.75;
  margin: 0 0 30px; max-width: 660px;
}

.hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.meta-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }

.meta-label {
  color: var(--text-muted); text-transform: uppercase; font-family: var(--font-hand); letter-spacing: 0; font-weight: 400;
}

.meta-value { color: var(--text-secondary); }

.meta-sep { width: 1px; height: 12px; background: var(--border); }

/* ====== 主体布局 ====== */
.main-layout {
  position: relative; z-index: 1;
  max-width: 1060px; margin: 0 auto; padding: 72px 24px;
  display: grid; grid-template-columns: 1fr 280px; gap: 56px;
}

/* ====== 侧边栏 ====== */
.sidebar { display: flex; flex-direction: column; gap: 20px; }

/* 侧边栏面板入场动效（错峰） */
.sidebar-panel {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
  animation: fadeInUp 0.5s ease both;
}
.sidebar .sidebar-panel:nth-child(1) { animation-delay: 100ms; }
.sidebar .sidebar-panel:nth-child(2) { animation-delay: 180ms; }
.sidebar .sidebar-panel:nth-child(3) { animation-delay: 260ms; }
.sidebar .sidebar-panel:nth-child(4) { animation-delay: 340ms; }

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
  flex: 1; font-size: 10px;
  font-family: var(--font-hand); font-weight: 400; letter-spacing: 0; font-weight: 400;
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
  .nav-toggle { display: flex; }
  .nav-actions { gap: 8px; }
  .search-input { width: 130px; }
  .user-name { display: none; }
  .user-caret { display: none; }
  .nav-links.open { display: flex; position: fixed; top: 0; right: 0; bottom: 0; width: min(78vw, 300px); flex-direction: column; align-items: stretch; gap: 0; background: var(--bg); border-left: 1px solid var(--border); padding: 72px 20px 24px; z-index: 95; box-shadow: -8px 0 24px var(--shadow-soft); }
  .nav-links.open::before { content: ''; position: fixed; inset: 0; background: var(--modal-overlay); z-index: -1; }
  .nav-links.open a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 14px; }
  .hero-inner { padding: 64px 20px 52px; }
  .hero-title { font-size: 30px; }
}

/* ====== Hero 滚动提示 ====== */
.hero-scroll-hint {
  display: flex; width: fit-content; align-items: center; gap: 8px;
  margin: 8px auto 0; padding: 4px 10px;
  background: none; border: 1px solid var(--border); border-radius: 999px;
  color: var(--text-muted); font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: color .2s, border-color .2s, transform .2s;
}
.hero-scroll-hint:hover { color: var(--accent); border-color: var(--accent); transform: translateY(-2px); }
.hint-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: ledBlink 1.6s ease-in-out infinite; }
.hint-label { font-family: var(--font-hand); font-size: 15px; letter-spacing: 0; }
.hint-caret { color: var(--accent); animation: floatCaret 2s ease-in-out infinite; }

/* ===== 信笺风覆盖（2026-10-11）===== */
.hero-inner { max-width: 820px; padding: 112px 24px 92px; }
.hero-excerpt { font-family: var(--font-sans); font-size: 18px; line-height: 1.85; color: var(--text-secondary); max-width: 660px; margin-bottom: 30px; }
.hero-badge { font-size: 15px; color: var(--text-muted); }
.hero-meta { gap: 16px; }
.meta-label { font-size: 15px; color: var(--text-muted); text-transform: none; }
.meta-value { font-size: 14px; }
.meta-sep { background: var(--border); }
.main-layout { padding: 84px 24px; gap: 64px; }
.sidebar-panel { background: transparent; border: 1px solid var(--border); border-radius: 4px; box-shadow: none; }
.panel-bar { border-bottom: 1px solid var(--border); }
.panel-title { font-size: 17px; color: var(--text-bright); }
.post-card, .post-item { border-bottom: 1px solid var(--border); }

/* 作者简介卡（信笺风）*/
.author-panel .panel-body { padding: 4px 0; }
.author-name { font-family: var(--font-hand); font-size: 22px; color: var(--text-bright); margin: 0 0 6px; }
.author-bio { font-size: 15px; line-height: 1.75; color: var(--text-secondary); margin: 0 0 14px; }
.author-links { display: flex; gap: 16px; }
.author-link { font-size: 14px; color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; padding-bottom: 1px; transition: border-color .2s; }
.author-link:hover { border-color: var(--accent); }



.view-all { display: inline-block; margin-top: 28px; font-size: 16px; color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; padding-bottom: 2px; transition: border-color .2s; }
.view-all:hover { border-color: var(--accent); }



/* 首页个人介绍（左对齐·非对称·信笺风）*/
.intro-strip { display: flex; gap: 36px; align-items: flex-start; max-width: 860px; margin: 0 auto; padding: 24px 24px 56px 24px; }
.intro-avatar { flex-shrink: 0; }
.intro-body { text-align: left; min-width: 0; }
.intro-name { font-family: var(--font-hand); font-size: 42px; font-weight: 400; color: var(--text-bright); margin: 0 0 6px; line-height: 1.1; }
.intro-role { font-size: 14px; letter-spacing: .12em; color: var(--text-dim); margin: 0 0 18px; }
.intro-text { font-size: 17px; line-height: 1.95; color: var(--text-secondary); max-width: 520px; margin: 0 0 24px; }
.intro-links { display: flex; gap: 12px; }
.intro-link { font-size: 15px; color: var(--text-bright); text-decoration: none; padding: 8px 20px; border: 1px solid var(--border-strong); border-radius: 4px; transition: background .25s var(--ease-spring), color .25s var(--ease-spring), border-color .25s var(--ease-spring); }
.intro-link:hover { background: var(--text-bright); color: var(--bg); border-color: var(--text-bright); }

/* 首页项目区（落地页·信笺风·左对齐）*/
.home-projects { max-width: 860px; margin: 0 auto; padding: 8px 24px 96px; text-align: left; }
.home-projects-title { font-family: var(--font-hand); font-size: 24px; font-weight: 400; color: var(--text-bright); margin: 0 0 8px; }
.project-list { list-style: none; margin: 0 0 28px; padding: 0; }
.project-row { padding: 26px 0; border-bottom: 1px solid var(--border); }
.project-name { font-size: 19px; font-weight: 600; color: var(--text-bright); margin: 0 0 8px; }
.project-desc { font-size: 16px; line-height: 1.85; color: var(--text-secondary); margin: 0 0 12px; max-width: 620px; }
.project-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.project-tags span { font-size: 13px; color: var(--text-dim); border: 1px solid var(--border); border-radius: 3px; padding: 2px 10px; }
</style>
