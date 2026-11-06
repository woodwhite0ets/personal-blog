<template>
  <div class="home-page">

    <!-- ====== 导航栏 ====== -->
    <SiteNav>
  <template #search>
    <div class="search-wrap" :class="{ active: searchActive }">
      <button class="btn btn-icon btn-search" type="button" aria-label="搜索文章" title="搜索" @click="toggleSearch">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="7.8" cy="7.8" r="5.2" stroke="currentColor" stroke-width="1.4"/>
          <path d="M11.7 11.7 15.4 15.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
      </button>
      <input
        v-if="searchActive"
        ref="searchInput"
        v-model="searchQuery" name="search"
        type="text"
        class="search-input"
        placeholder="搜索文章…"
        @keydown.escape="closeSearch"
        @keydown.enter="doSearch"
      />
    </div>
  </template>
</SiteNav>

    <span class="edge-label" aria-hidden="true">2026</span>

    <!-- ====== 首屏 Hero 带（非对称：左文 + 右信息栏）====== -->
    <section class="hero-band">
      <!-- 首屏底图：五套「印在纸上的画」，每次刷新随机一套（组件见 common/HeroBackdrop.vue） -->
      <HeroBackdrop session-key="blog-hero-art" />
      <div class="hero-in">
        <div class="hero-text">
          <p class="hero-badge"><span class="hero-badge-dot" aria-hidden="true"></span>持续更新 · 全栈 / 系统 / AI 工程</p>
          <h1 class="hero-name" aria-label="WoodWhite"><span>W</span><span>o</span><span>o</span><span>d</span><span>W</span><span>h</span><span>i</span><span>t</span><span>e</span></h1>
          <p class="hero-role"><span>应届毕业生</span><span>Web 全栈开发</span></p>
          <p class="hero-statement">写代码、做系统、记录踩过的坑。这里是我关于全栈开发、系统架构与开源实践的手记。</p>
          <div class="hero-topics" v-if="topTags.length">
            <router-link
              v-for="t in topTags" :key="t.name"
              :to="`/forum?tag=${encodeURIComponent(t.name)}`"
              class="hero-topic"
            >{{ t.name }}<span class="hero-topic-n">{{ t.post_count }}</span></router-link>
          </div>
          <div class="hero-actions">
            <router-link to="/forum" class="hero-btn hero-btn-solid">阅读文章</router-link>
            <a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener" class="hero-btn hero-btn-ghost">GitHub</a>
          </div>
          <p class="hero-trust">
            <span>{{ loading ? '…' : `${totalPublished} 篇已发布` }}</span>
            <i aria-hidden="true"></i>
            <span>{{ stats.views ? `${fmt(stats.views)} 次阅读` : '持续更新中' }}</span>
            <i aria-hidden="true"></i>
            <span v-if="stats.uptimeDays">已运行 {{ stats.uptimeDays }} 天</span>
            <span v-else>自建工作站</span>
          </p>
        </div>
        <aside class="hero-recent" v-if="posts.length">
          <div class="hr-head">最新</div>
          <router-link
            v-for="p in posts.slice(0, 3)" :key="p.id"
            :to="`/post/${p.slug || p.id}`" class="hr-item"
          >
            <span class="hr-title">{{ p.title }}</span>
            <span class="hr-date">{{ (p.date || '').slice(5) }}</span>
          </router-link>
          <router-link to="/forum" class="hr-more">全部 {{ totalPublished }} 篇</router-link>
        </aside>

        <!-- 加载/失败时也要有东西占位，别让整列凭空消失 -->
        <aside v-else-if="loading" class="hero-recent" aria-hidden="true">
          <div class="hr-head">最新</div>
          <div v-for="n in 3" :key="n" class="hr-item hr-skeleton">
            <span class="hr-sk-bar"></span>
            <span class="hr-sk-bar short"></span>
          </div>
        </aside>
        <aside v-else-if="error" class="hero-recent">
          <div class="hr-head">最新</div>
          <p class="hr-error">文章没加载出来。</p>
          <button type="button" class="hr-retry" @click="refresh">重试</button>
        </aside>
        <div class="hero-visual">
<svg class="hero-graph" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
        <g class="hg-rings">
          <circle cx="200" cy="200" r="46" />
          <circle cx="200" cy="200" r="92" />
          <circle cx="200" cy="200" r="138" />
          <circle cx="200" cy="200" r="184" />
        </g>
        <g class="hg-spokes">
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(0 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(30 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(60 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(90 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(120 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(150 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(180 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(210 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(240 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(270 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(300 200 200)" />
          <line x1="200" y1="200" x2="200" y2="16" transform="rotate(330 200 200)" />
        </g>
        <g class="hg-nodes">
          <circle cx="314.4" cy="277.2" r="3.2" />
          <circle cx="123.7" cy="251.4" r="2.6" />
          <circle cx="102.5" cy="44.0" r="2.6" />
          <circle cx="273.1" cy="83.0" r="3.2" />
          <circle cx="238.3" cy="380.0" r="2.2" />
          <circle cx="155.8" cy="187.3" r="2.2" />
        </g>
        <circle class="hg-core" cx="200" cy="200" r="4" />
        <circle class="hg-ping" cx="200" cy="200" r="4" />
      </svg>
        </div>
      </div>
    </section>

    <!-- AI 项目榜（每日更新）-->
    <div class="hm">
      <section class="hm-sec ai-snip-sec">
        <p class="hm-eyebrow">今日榜单 · DAILY</p>
        <AiDailySnippet />
      </section>
    </div>

    <!-- 运行事实：一条窄带，打断“纯列表”的节奏（数据全部来自 /api/stats） -->
    <div class="hm">
      <div class="status-band" v-if="stats.posts">
        <span class="sb-item"><span class="sb-k">已运行</span><span class="sb-v">{{ stats.uptimeDays }} 天</span></span>
        <span class="sb-item"><span class="sb-k">文章</span><span class="sb-v">{{ stats.posts }}</span></span>
        <span class="sb-item"><span class="sb-k">模型收录</span><span class="sb-v">{{ stats.models }}</span></span>
        <span class="sb-item"><span class="sb-k">工具收录</span><span class="sb-v">{{ stats.tools }}</span></span>
        <span class="sb-item"><span class="sb-k">上次采集</span><span class="sb-v">{{ stats.lastDaily || '—' }}</span></span>
      </div>
    </div>

    <!-- 热门文章（按阅读量，数据来自 /api/posts?sort=popular） -->
    <div class="hm" v-if="popular.length">
      <section class="hm-sec pop-sec">
        <p class="hm-eyebrow">热门 · MOST READ</p>
        <div class="pop-head">
          <h2 class="hm-h">读得最多的几篇</h2>
          <router-link class="pop-more" to="/forum?sort=popular">全部文章 →</router-link>
        </div>
        <ol class="pop-list">
          <li v-for="(p, i) in popular" :key="p.id">
            <router-link :to="`/post/${p.slug || p.id}`" class="pop-item">
              <span class="pop-rank">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="pop-title">{{ p.title }}</span>
              <span class="pop-date">{{ (p.date || '').slice(0, 10) }}</span>
              <span class="pop-views">{{ fmt(p.views) }} 阅读</span>
            </router-link>
          </li>
        </ol>
      </section>
    </div>

    <!-- 项目（色带，打破纵向单调）-->
    <section class="band-tint">
      <div class="hm">
        <!-- 工作站：在用的项目 -->
        <section class="hm-sec ws-sec">
          <p class="hm-eyebrow">在跑的东西 · RUNNING</p>
          <WorkspaceSnippet />
        </section>

      </div>
    </section>

    <!-- 工具库精选（按用途收的 AI 工具，只列我自己在用的） -->
    <div class="hm" v-if="featuredTools.length">
      <section class="hm-sec">
        <p class="hm-eyebrow">按用途收录 · TOOLBOX</p>
        <div class="tl-snip-head">
          <h2 class="hm-h">工具库</h2>
          <router-link class="tl-snip-more" to="/tools">全部 {{ stats.tools || '' }} 个</router-link>
        </div>
        <p class="tl-snip-sub">按用途收的 AI 工具，这里只列我自己每天在用的。</p>
        <ul class="tl-snip-grid">
          <li v-for="(t, i) in featuredTools" :key="t.slug" :data-cat="t.category">
            <router-link :to="`/tools/${t.slug}`" class="tl-snip-card paper-field">
              <span class="tl-snip-name">{{ t.name }}</span>
              <span class="tl-snip-desc">{{ t.tagline_zh || t.desc_en }}</span>
              <span class="tl-snip-meta">{{ t.category_label }}</span>
            </router-link>
          </li>
        </ul>
      </section>
    </div>

    <div class="hm">
      <!-- 关于 -->
      <section class="hm-sec">
        <p class="hm-eyebrow">关于 · ABOUT</p>
        <h2 class="hm-h">关于</h2>
        <div class="hm-about-grid">
          <div class="hm-about">
            <UserAvatar src="/uploads/avatars/msa76e9z-taqz.jpg" alt="WoodWhite" size="md" />
            <p class="hm-text hm-text-lead">本科应届生，主修 Web 前端与全栈开发，熟悉 Vue 3、Node.js、MySQL。喜欢把复杂的东西做简单，也喜欢把做过的事写下来。</p>
            <dl class="hm-stats">
              <div><dt>现在</dt><dd>分布式系统与 AI 工程化</dd></div>
              <div><dt>已发布</dt><dd>{{ loading ? '…' : `${totalPublished} 篇` }}</dd></div>
              <div><dt>阅读</dt><dd>{{ loading ? '…' : stats.views }}</dd></div>
              <div><dt>分类</dt><dd>{{ loading ? '…' : tags.length }}</dd></div>
            </dl>
          </div>
          <div class="hm-bars" v-if="tags.length">
            <div class="bm-head">写过的方向</div>
            <div class="hm-bar" v-for="t in topTags6" :key="t.name">
              <span class="hm-bar-name">{{ t.name }}</span>
              <span class="hm-bar-num">{{ t.post_count }}</span>
            </div>
          </div>
        </div>
      </section>

    </div>

    <SiteFooter command='echo "© 2026 woodwhite@blog"' />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import HeroBackdrop from '../common/HeroBackdrop.vue'
import SiteFooter from '../common/SiteFooter.vue'
import AiDailySnippet from './AiDailySnippet.vue'
import WorkspaceSnippet from './WorkspaceSnippet.vue'
import UserAvatar from '../common/UserAvatar.vue'
import { useAuth } from '../../stores/auth.js'
import { usePosts } from '../../composables/usePosts.js'

const route = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, isAdmin } = useAuth()

// 站点统计 + 热门文章
const stats = ref({ posts: 0, views: 0, comments: 0, tags: 0, byMonth: [] })
const featuredTools = ref([])
const popular = ref([])
// 数字加千分位：21300 → 21,300
const fmt = (n) => Number(n || 0).toLocaleString('en-US')
async function loadExtra() {
  try {
    const [a, c, d] = await Promise.all([
      fetch('/api/stats').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/ai-tools?mode=featured&limit=6').then(r => r.ok ? r.json() : null).catch(() => null),
      // 热门：按阅读量取前 5（route 只在论坛页读 sort 参数，这里直接用接口）
      fetch('/api/posts?sort=popular&status=published&type=owner').then(r => r.ok ? r.json() : null).catch(() => null),
    ])
    if (a) stats.value = a
    if (c) {
      featuredTools.value = (c.items || []).slice(0, 6)
    }
    if (d) popular.value = (d.posts || []).slice(0, 5)
  } catch { /* 首页附属模块失败不影响主列表 */ }
}

// ====== 文章数据层（取数/分页/筛选/搜索/标签/作者统计） ======
const {
  posts, loading, loadingMore, error, currentPage, totalPages,
  tags, contributors, totalPublished, sortMode,
  pinnedPost, hasMore, activeTag, activeSearch,
  clearTagLink, clearSearchLink,
  switchSort, loadMore, fetchPosts, refresh,
} = usePosts()

// 主题标签（首屏"这里写什么" + 关于区块分布图）
const topTags = computed(() => [...tags.value].sort((a, b) => Number(b.post_count) - Number(a.post_count)).slice(0, 5))
const topTags6 = computed(() => [...tags.value].sort((a, b) => Number(b.post_count) - Number(a.post_count)).slice(0, 6))

// ====== 用户菜单 ======
const showUserMenu = ref(false)
const userMenuRef = ref(null)

// ====== 搜索状态 ======
const searchActive = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)


function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    showUserMenu.value = false
  }
}


// ====== 首屏光标跟随光晕 ======
// 只写两个 px 变量去 translate 一个固定的渐变层（走合成器），
// 而且 pointermove 用 rAF 合并，避免每帧重绘整块首屏。
let heroBand = null
let heroRect = null
let glowX = 0
let glowY = 0
let glowRaf = 0
let heroObserver = null

const applyGlow = () => {
  glowRaf = 0
  if (!heroBand) return
  heroBand.style.setProperty('--gx', `${glowX}px`)
  heroBand.style.setProperty('--gy', `${glowY}px`)
}

const onHeroMove = (e) => {
  if (!heroBand) return
  if (!heroRect) heroRect = heroBand.getBoundingClientRect()
  glowX = e.clientX - heroRect.left
  glowY = e.clientY - heroRect.top
  if (!glowRaf) glowRaf = requestAnimationFrame(applyGlow)
  if (!heroBand.classList.contains('glow-on')) heroBand.classList.add('glow-on')
}

const refreshHeroRect = () => { heroRect = heroBand ? heroBand.getBoundingClientRect() : null }

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadExtra()
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (fine && !calm) {
    heroBand = document.querySelector('.hero-band')
    if (heroBand) {
      heroBand.addEventListener('pointermove', onHeroMove, { passive: true })
      heroBand.addEventListener('pointerenter', refreshHeroRect, { passive: true })
      heroObserver = new ResizeObserver(refreshHeroRect)
      heroObserver.observe(heroBand)
    }
  }
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (heroBand) {
    heroBand.removeEventListener('pointermove', onHeroMove)
    heroBand.removeEventListener('pointerenter', refreshHeroRect)
  }
  if (heroObserver) heroObserver.disconnect()
  if (glowRaf) cancelAnimationFrame(glowRaf)
})

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
  router.push({ path: '/blog', query })
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
/* 首页留白节奏：大板块间距 64px，内容短的板块再收紧 */
.hm-sec { padding: 56px 0; }
.hm-h { margin-bottom: 18px; }
.hm-proj .bezel-core { padding: 26px 28px; }
.hm-proj .proj-svg { margin-bottom: 16px; }
.hm-text { font-size: 0.9062rem; line-height: 1.7; }
.ai-snip-sec { padding: 40px 0 30px; }
/* .hm 默认带 112px 底部 padding；首页拆成多个 .hm 容器后每段都会多出来，统一去掉，
   底部留白交给最后一个板块自己控制 */
.hm { padding-bottom: 0; }
.hm-sec-last { padding-bottom: 56px; }
.ws-sec { padding: 48px 0 56px; }
@media (max-width: 900px) {
  .hm-sec { padding: 40px 0; }
  .ai-snip-sec { padding: 32px 0 24px; }
  .ws-sec { padding: 40px 0 44px; }
}
.hm-proj { min-width: 0; }
:root { color-scheme: dark; }

.home-page {
  min-height: 100dvh;
  background-color: var(--bg);
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
  background-color: var(--bg-elevated); border: 1px solid var(--border-strong); border-left: none;
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

.user-avatar {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent); color: var(--on-accent);
  font-weight: 700; font-size: 0.75rem;
  border-radius: 6px; text-transform: uppercase;
}

.user-name { font-weight: 500; color: var(--text-secondary); }

.user-caret {
  font-size: 0.625rem; color: var(--text-muted); transition: transform 0.2s;
}

.user-caret.open { transform: rotate(180deg); }

.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 180px;
  background-color: var(--bg-float); border: 1px solid var(--border-strong);
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
  font-family: var(--font-hand); font-size: 0.875rem; font-weight: 400; letter-spacing: 0;
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
  font-family: var(--font-mono); font-size: 0.75rem;
  color: var(--text-dim); margin: -6px 0 30px;
  padding: 7px 15px; border-radius: 999px;
  background: var(--overlay-a2); border: 1px solid var(--border);
}
.hero-prompt { color: var(--accent); }
.hero-caret { color: var(--accent); animation: caretBlink 1s step-end infinite; }

.hero-title {
  font-family: var(--font-hand);
  font-size: clamp(2.125rem, 4.6vw, 3.375rem); font-weight: 400; line-height: 1.42;
  margin: 0 0 22px; max-width: 780px; letter-spacing: 0;
}

.hero-title a {
  color: var(--text-bright); text-decoration: none; transition: color 0.2s;
}

.hero-title a:hover { color: var(--accent); }

.hero-excerpt {
  font-size: 1.0625rem; color: var(--text-dim); line-height: 1.75;
  margin: 0 0 30px; max-width: 660px;
}

.hero-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.6875rem; }

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
  background-color: var(--bg-elevated); border: 1px solid var(--border);
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
  flex: 1; font-size: 0.625rem;
  font-family: var(--font-hand); font-weight: 400; letter-spacing: 0; font-weight: 400;
  color: var(--text-muted); text-align: center;
  letter-spacing: 1.5px; text-transform: lowercase;
}

.panel-body { padding: 14px 16px; }

.info-line {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 0.6875rem;
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
  border-radius: 6px; font-size: 0.75rem;
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
  font-size: 0.625rem; text-transform: uppercase; letter-spacing: 1px;
  color: var(--text-muted);
}
.sort-btn {
  padding: 4px 12px;
  font-family: inherit; font-size: 0.6875rem; font-weight: 600;
  color: var(--text-dim); background-color: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 4px;
  cursor: pointer; transition: color 0.2s, background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.2s, box-shadow 0.2s;
}
.sort-btn:hover { border-color: var(--accent-a30); color: var(--text); }
.sort-btn.active {
  color: var(--on-accent); background: var(--accent);
  border-color: var(--accent);
}


.filter-prompt { color: var(--accent); font-weight: 700; }
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
  font-size: 0.6875rem; padding: 4px 10px;
  background: var(--overlay-a3);
  border: 1px solid var(--border); border-radius: 4px;
  color: var(--text-dim); cursor: pointer; transition: color 0.2s, background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
}

.tag:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-a4); }
.tag.router-link-active { border-color: var(--accent); color: var(--accent); }
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

.contributor-avatar {
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-a10); color: var(--accent);
  border-radius: 4px; font-size: 0.625rem; font-weight: 700;
  text-transform: uppercase;
}

.contributor-name { flex: 1; }

.contributor-count {
  font-size: 0.625rem; color: var(--text-muted);
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
  .nav-links.open { display: flex; position: fixed; top: 0; right: 0; bottom: 0; width: min(78vw, 300px); flex-direction: column; align-items: stretch; gap: 0; background-color: var(--bg); border-left: 1px solid var(--border); padding: 72px 20px 24px; z-index: 95; box-shadow: -8px 0 24px var(--shadow-soft); }
  .nav-links.open::before { content: ''; position: fixed; inset: 0; background: var(--modal-overlay); z-index: -1; }
  .nav-links.open a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
  .hero-inner { padding: 64px 20px 52px; }
  .hero-title { font-size: 1.875rem; }
}

/* ====== Hero 滚动提示 ====== */
/* ===== 信笺风覆盖（2026-10-11）===== */
.hero-inner { max-width: 860px; padding: 112px 24px 92px; }
.hero-excerpt { font-family: var(--font-sans); font-size: 1.125rem; line-height: 1.85; color: var(--text-secondary); max-width: 660px; margin-bottom: 30px; }
.hero-badge { font-size: 0.9375rem; color: var(--text-muted); }
.hero-meta { gap: 16px; }
.meta-label { font-size: 0.9375rem; color: var(--text-muted); text-transform: none; }
.meta-value { font-size: 0.875rem; }
.meta-sep { background: var(--border); }
.main-layout { padding: 84px 24px; gap: 64px; }
.sidebar-panel { background: transparent; border: 1px solid var(--border); border-radius: 4px; box-shadow: none; }
.panel-bar { border-bottom: 1px solid var(--border); }
.panel-title { font-size: 1.0625rem; color: var(--text-bright); }
.post-card, .post-item { border-bottom: 1px solid var(--border); }

/* 作者简介卡（信笺风）*/
.author-panel .panel-body { padding: 4px 0; }
.author-name { font-family: var(--font-hand); font-size: 1.375rem; color: var(--text-bright); margin: 0 0 6px; }
.author-bio { font-size: 0.9375rem; line-height: 1.75; color: var(--text-secondary); margin: 0 0 14px; }
.author-links { display: flex; gap: 16px; }
.author-link { font-size: 0.875rem; color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; padding-bottom: 1px; transition: border-color .2s; }
.author-link:hover { border-color: var(--accent); }



.view-all { display: inline-block; margin-top: 28px; font-size: 1rem; color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; padding-bottom: 2px; transition: border-color .2s; }
.view-all:hover { border-color: var(--accent); }



/* 首页个人介绍（左对齐·非对称·信笺风）*/
.intro-strip { display: flex; gap: 36px; align-items: flex-start; max-width: 860px; margin: 0 auto; padding: 24px 24px 56px 24px; }
.intro-avatar { flex-shrink: 0; }
.intro-body { text-align: left; min-width: 0; }
.intro-name { font-family: var(--font-hand); font-size: 2.625rem; font-weight: 400; color: var(--text-bright); margin: 0 0 6px; line-height: 1.1; }
.intro-role { font-size: 0.875rem; letter-spacing: .12em; color: var(--text-dim); margin: 0 0 18px; }
.intro-text { font-size: 1.0625rem; line-height: 1.95; color: var(--text-secondary); max-width: 520px; margin: 0 0 24px; }
.intro-links { display: flex; gap: 12px; }
.intro-link { font-size: 0.9375rem; color: var(--text-bright); text-decoration: none; padding: 8px 20px; border: 1px solid var(--border-strong); border-radius: 4px; transition: background .25s var(--ease-spring), color .25s var(--ease-spring), border-color .25s var(--ease-spring); }
.intro-link:hover { background: var(--text-bright); color: var(--bg); border-color: var(--text-bright); }

/* 首页项目区（落地页·信笺风·左对齐）*/
.home-projects { max-width: 860px; margin: 0 auto; padding: 8px 24px 96px; text-align: left; }
.home-projects-title { font-family: var(--font-hand); font-size: 1.5rem; font-weight: 400; color: var(--text-bright); margin: 0 0 8px; }
.project-list { list-style: none; margin: 0 0 28px; padding: 0; }
.project-row { padding: 26px 0; border-bottom: 1px solid var(--border); }
.project-name { font-size: 1.1875rem; font-weight: 600; color: var(--text-bright); margin: 0 0 8px; }
.project-desc { font-size: 1rem; line-height: 1.85; color: var(--text-secondary); margin: 0 0 12px; max-width: 620px; }
.project-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.project-tags span { font-size: 0.8125rem; color: var(--text-dim); border: 1px solid var(--border); border-radius: 3px; padding: 2px 10px; }

/* 信笺统一（组件内，替代原全局 !important）*/
.sidebar-panel { background: transparent; border: 1px solid var(--border); border-radius: 4px; box-shadow: none; padding: 6px; }
.panel-bar { border-bottom: 1px solid var(--border); background: transparent; padding: 14px 18px 12px; }
.panel-body { padding: 14px 18px 18px; }
.panel-title { font-family: var(--font-hand); font-size: 1.0625rem; font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--text-bright); }
.info-key { color: var(--text-dim); }

.sort-bar { padding: 12px 18px; }
.sort-btn { padding: 6px 14px; }

/* 首页最近更新（信笺风）*/
.home-recent { margin: 0; padding: 0; }
.home-recent-title { font-family: var(--font-hand); font-size: 1.5rem; font-weight: 400; color: var(--text-bright); margin: 0 0 8px; }
.recent-list { list-style: none; margin: 0 0 20px; padding: 0; }
.recent-list li { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.recent-link { font-size: 1.0625rem; color: var(--text); text-decoration: none; transition: color .2s; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-link:hover { color: var(--accent); }
.recent-date { font-size: 0.8125rem; color: var(--text-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
.home-stats { font-size: 0.875rem; color: var(--text-dim); margin: 0; }
.stats-link { color: var(--accent); text-decoration: none; }
.stats-link:hover { text-decoration: underline; }

/* 首页 现在 / 友链 */
.home-now, .home-links { margin: 0; padding: 0; }
.home-now-title, .home-links-title { font-family: var(--font-hand); font-size: 1.5rem; font-weight: 400; color: var(--text-bright); margin: 0 0 10px; }
.home-now-text { font-size: 1.0625rem; line-height: 1.95; color: var(--text-secondary); max-width: 620px; margin: 0; }
.friend-list { display: flex; flex-wrap: wrap; align-items: baseline; gap: 16px; }
.friend-item { font-size: 1rem; color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; padding-bottom: 2px; transition: border-color .2s; }
.friend-item:hover { border-color: var(--accent); }
.friend-empty { font-size: 0.875rem; color: var(--text-dim); }

/* 首页 热门文章 / 写作活动 */
.home-popular { margin: 0; padding: 0; }
.home-activity { max-width: 860px; margin: 0 auto; padding: 0 24px 96px; }
.home-popular-title, .home-activity-title { font-family: var(--font-hand); font-size: 1.5rem; font-weight: 400; color: var(--text-bright); margin: 0 0 16px; }
.popular-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.popular-card { display: flex; flex-direction: column; gap: 8px; padding: 20px 18px; border: 1px solid var(--border); border-radius: 4px; text-decoration: none; transition: border-color .25s, transform .25s; }
.popular-card:hover { border-color: var(--text-bright); transform: translateY(-2px); }
.popular-num { font-family: var(--font-hand); font-size: 1.25rem; color: var(--text-faint); }
.popular-title { font-size: 1rem; line-height: 1.5; color: var(--text-bright); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.popular-meta { font-size: 0.8125rem; color: var(--text-dim); margin-top: auto; }
.activity-grid { display: flex; align-items: flex-end; gap: 10px; height: 84px; margin-bottom: 14px; }
.activity-col { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.activity-bar { width: 22px; background: var(--accent); border-radius: 2px; opacity: .85; }
.activity-label { font-size: 0.75rem; color: var(--text-dim); }
.activity-sum { font-size: 0.875rem; color: var(--text-dim); margin: 0; font-variant-numeric: tabular-nums; }
@media (max-width: 700px) { .popular-grid { grid-template-columns: 1fr; } }

/* 首页两栏并排（打破纵向单调）*/
.home-cols { max-width: 860px; margin: 0 auto; padding: 0 24px 64px; display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: start; }
@media (max-width: 760px) { .home-cols { grid-template-columns: 1fr; gap: 40px; } }

/* ===== 2026-11-05 对照 teamorouter 的结构重做 ===== */
/* 首屏徽标 + 信任行 */
.hero-badge {
  display: inline-flex; align-items: center; gap: 8px; margin: 0 0 18px;
  padding: 5px 12px; border: 1px solid var(--border); border-radius: 999px;
  font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .04em;
  color: var(--text-dim); background: var(--overlay-a2);
}
.hero-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex: none; }
.hero-trust {
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin: 22px 0 0;
  font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .03em; color: var(--text-faint);
}
.hero-trust i { width: 1px; height: 10px; background: var(--border-strong); display: inline-block; }

/* 板块小标签：先给分类，再给标题（同 teamorouter 的「价格 · PRICE」） */
.hm-eyebrow {
  margin: 0 0 10px; font-family: var(--font-mono); font-size: 0.625rem;
  letter-spacing: .12em; text-transform: uppercase; color: var(--text-faint);
}
.hm-eyebrow + .hm-h { margin-top: 2px; }

/* 热门文章：排行列表（编号 + 标题 + 日期 + 阅读量） */
.pop-sec { padding: 44px 0 40px; }
.pop-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 6px; }
.pop-head .hm-h { margin-bottom: 0; flex: 1; }
.pop-more { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .03em; color: var(--text-dim); text-decoration: none; }
.pop-more:hover { color: var(--accent); }
.pop-list { list-style: none; margin: 14px 0 0; padding: 0; border-top: 1px solid var(--border-strong); }
.pop-item {
  display: grid; grid-template-columns: 34px minmax(0, 1fr) 92px 84px; align-items: baseline; gap: 14px;
  padding: 12px 2px; border-bottom: 1px solid var(--border); text-decoration: none;
  transition: background-color var(--dur-hover) var(--ease-out);
}
.pop-item:hover { background: var(--overlay-a2); }
.pop-item:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.pop-rank { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-faint); }
.pop-title { font-size: 0.9375rem; line-height: 1.55; color: var(--text-bright); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pop-item:hover .pop-title { color: var(--accent); }
.pop-date, .pop-views { font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .02em; color: var(--text-faint); text-align: right; }
@media (max-width: 700px) {
  .pop-item { grid-template-columns: 26px minmax(0, 1fr) 72px; gap: 10px; }
  .pop-date { display: none; }
  .pop-title { white-space: normal; }
}

/* ===== 动效：跟公司页同一套语言（滚动驱动 + 只动合成器属性） ===== */
/* 1. 热门榜：hover 时标题右移 2px、序号与阅读数变强调色 */
.pop-item { transition: background-color var(--dur-hover) var(--ease-out); }
.pop-title, .pop-rank, .pop-views { transition: color var(--dur-hover) var(--ease-out), translate var(--dur-hover) var(--ease-out); }
.pop-item:hover .pop-title { translate: 2px 0; }
.pop-item:hover .pop-rank, .pop-item:hover .pop-views { color: var(--accent); }

/* 2. 首屏信任行：等主标题落位后再淡入 */
.hero-trust { animation: fadeInUp .6s var(--ease-out) .42s both; }

/* 3. 工具卡：进视口轻弹 + hover 抬起 2px */
@supports (animation-timeline: view()) {
  .tl-snip-grid li { animation: popRise linear both; animation-timeline: view(); animation-range: entry 6% entry 24%; }
}
@keyframes popRise {
  from { opacity: 0; scale: .972; }
  to   { opacity: 1; scale: 1; }
}
.tl-snip-card { transition: border-color var(--dur-hover) var(--ease-out), background-color var(--dur-hover) var(--ease-out), translate var(--dur-hover) var(--ease-out); }
.tl-snip-grid li:hover .tl-snip-card { translate: 0 -2px; }

/* 4. 板块小标签：左侧短线随进入视口展开 */
.hm-eyebrow { position: relative; padding-left: 0; }
.hm-eyebrow::before {
  content: ""; display: inline-block; vertical-align: middle;
  width: 18px; height: 1px; margin-right: 8px;
  background: color-mix(in srgb, var(--accent) 55%, transparent);
  transform: scaleX(.35); transform-origin: left;
  transition: transform .5s var(--ease-out);
}
.hm-eyebrow:hover::before { transform: scaleX(1); }

/* 5. 运行事实带：等进入视口再淡入，数字用等宽数字防跳动 */
.sb-v { font-variant-numeric: tabular-nums; }
@supports (animation-timeline: view()) {
  .status-band { animation: bandFade linear both; animation-timeline: view(); animation-range: entry 10% entry 60%; }
}
@keyframes bandFade {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-trust, .tl-snip-grid li, .status-band { animation: none !important; }
  .pop-item:hover .pop-title, .tl-snip-grid li:hover .tl-snip-card { translate: none; }
}
</style>
