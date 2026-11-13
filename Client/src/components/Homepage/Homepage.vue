<template>
  <div class="home-page">
    <div class="page-wash" aria-hidden="true"></div>

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
.hm-text { font-size: 0.875rem; line-height: 1.7; }
.ai-snip-sec { padding: 40px 0 30px; }
/* .hm 默认带 112px 底部 padding；首页拆成多个 .hm 容器后每段都会多出来，统一去掉，
   底部留白交给最后一个板块自己控制 */
.hm { padding-bottom: 0; }
.ws-sec { padding: 48px 0 56px; }
@media (max-width: 900px) {
  .hm-sec { padding: 40px 0; }
  .ai-snip-sec { padding: 32px 0 24px; }
  .ws-sec { padding: 40px 0 44px; }
}
:root { color-scheme: dark; }

.home-page {
  min-height: 100dvh;
  /* 让底图（.page-wash 那张淡灰实拍）透上来，不再是整块不透明纸 */
  background-color: transparent;
  font-family: var(--font-sans);
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

@keyframes scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

.nav-links a:hover,
.nav-links a.router-link-active { color: var(--text); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }
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
  border-radius: 8px 0 0 6px;
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

.user-caret.open { transform: rotate(180deg); }

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
.dim { opacity: 0.3; }
.sort-btn.active {
  color: var(--on-accent); background: var(--accent);
  border-color: var(--accent);
}

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
.tag.xs { font-size: 0.6875rem; opacity: 0.7; }

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .search-input { width: 130px; }
  .nav-links.open { display: flex; position: fixed; top: 0; right: 0; bottom: 0; width: min(78vw, 300px); flex-direction: column; align-items: stretch; gap: 0; background-color: var(--bg); border-left: 1px solid var(--border); padding: 72px 20px 24px; z-index: 95; box-shadow: -8px 0 24px var(--shadow-soft); }
  .nav-links.open::before { content: ''; position: fixed; inset: 0; background: var(--modal-overlay); z-index: -1; }
  .nav-links.open a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
}
.hero-badge { font-size: 0.9375rem; color: var(--text-muted); }
@media (max-width: 700px) { }
@media (max-width: 760px) { }

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
  margin: 0 0 10px; font-family: var(--font-mono); font-size: 0.6875rem;
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
.pop-date, .pop-views { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .02em; color: var(--text-faint); text-align: right; }
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
