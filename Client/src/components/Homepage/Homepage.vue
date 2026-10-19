<template>
  <div class="home-page">

    <!-- ====== 导航栏 ====== -->
    <SiteNav>
  <template #search>
    <div class="search-wrap" :class="{ active: searchActive }">
      <button class="btn btn-icon btn-search" @click="toggleSearch" title="搜索">
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="7.8" cy="7.8" r="5.2" stroke="currentColor" stroke-width="1.4"/>
          <path d="M11.7 11.7 15.4 15.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
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

    <span class="edge-label" aria-hidden="true">woodwhite@blog · 2026</span>

    <!-- ====== 首屏 Hero 带（非对称：左文 + 右信息栏）====== -->
    <section class="hero-band">
      <div class="hero-in">
        <div class="hero-text">
          <h1 class="hero-name" aria-label="WoodWhite"><span>W</span><span>o</span><span>o</span><span>d</span><span>W</span><span>h</span><span>i</span><span>t</span><span>e</span></h1>
          <p class="hero-role">应届毕业生 · Web 全栈开发</p>
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
            <a href="https://github.com" target="_blank" rel="noopener" class="hero-btn hero-btn-ghost">GitHub</a>
          </div>
          <dl class="hero-rail">
            <div><dt>现在</dt><dd>分布式系统与 AI 工程化</dd></div>
            <div><dt>已发布</dt><dd>{{ totalPublished }} 篇</dd></div>
            <div><dt>阅读</dt><dd>{{ stats.views }}</dd></div>
            <div><dt>分类</dt><dd>{{ tags.length }}</dd></div>
          </dl>
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
      <div class="hero-scroll-hint" aria-hidden="true">Scroll</div>
    </section>

    <div class="hm">
      <!-- 置顶 -->
      <section class="hm-sec" v-if="pinnedPost">
        <h2 class="hm-h">置顶</h2>
        <router-link :to="`/post/${pinnedPost.slug || pinnedPost.id}`" class="hm-feature">
          <div class="bezel-core">
            <h3 class="hm-feature-title">{{ pinnedPost.title }}</h3>
            <p class="hm-feature-excerpt">{{ cleanExcerpt(pinnedPost.excerpt) }}</p>
            <p class="hm-meta">{{ pinnedPost.date }} · {{ pinnedPost.read_time }} · {{ pinnedPost.views || 0 }} 次阅读</p>
          </div>
        </router-link>
      </section>

      <!-- 关于 -->
      <section class="hm-sec">
        <h2 class="hm-h">关于</h2>
        <div class="hm-about-grid">
          <div class="hm-about">
            <UserAvatar src="/uploads/avatars/msa76e9z-taqz.jpg" alt="WoodWhite" size="md" />
            <p class="hm-text hm-text-lead">本科应届生，主修 Web 前端与全栈开发，熟悉 Vue 3、Node.js、MySQL。喜欢把复杂的东西做简单，也喜欢把做过的事写下来。</p>
          </div>
          <div class="hm-bars" v-if="tags.length">
            <div class="bm-head">写过的方向</div>
            <div class="hm-bar" v-for="t in topTags6" :key="t.name">
              <span class="hm-bar-name">{{ t.name }}</span>
              <span class="hm-bar-track"><i :style="{ width: Math.max(6, (Number(t.post_count) / maxTagCount) * 100) + '%' }"></i></span>
              <span class="hm-bar-num">{{ t.post_count }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 项目（色带，打破纵向单调）-->
    <section class="band-tint">
      <div class="hm">
        <div class="hm-sec hm-sec-last">
          <h2 class="hm-h">项目</h2>
          <div class="hm-2up">
            <router-link to="/about" class="hm-proj">
              <div class="bezel-core">
      <svg class="proj-svg" viewBox="0 0 420 150" aria-hidden="true" focusable="false">
        <g class="pv-line">
          <rect x="14" y="52" width="86" height="46" rx="8" />
          <rect x="150" y="38" width="120" height="74" rx="10" />
          <rect x="320" y="14" width="86" height="32" rx="6" />
          <rect x="320" y="59" width="86" height="32" rx="6" />
          <rect x="320" y="104" width="86" height="32" rx="6" />
          <path d="M100 75 H146" />
          <path d="M270 75 C295 75 295 30 316 30" />
          <path d="M270 75 H316" />
          <path d="M270 75 C295 75 295 120 316 120" />
        </g>
        <g class="pv-dot">
          <circle cx="270" cy="75" r="2.5" />
          <circle cx="100" cy="75" r="2.5" />
        </g>
        <g class="pv-label">
          <text x="57" y="80" text-anchor="middle">AI 客户端</text>
          <text x="210" y="72" text-anchor="middle">mcp-gateway</text>
          <text x="210" y="90" text-anchor="middle" class="pv-sub">鉴权 · 路由 · 审计</text>
          <text x="363" y="34" text-anchor="middle">知识库</text>
          <text x="363" y="79" text-anchor="middle">服务器</text>
          <text x="363" y="124" text-anchor="middle">工具链</text>
        </g>
      </svg>
                <h3 class="hm-proj-title">mcp-gateway</h3>
                <p class="hm-text">面向知识库与服务器管理的 MCP 网关，把检索与运维能力统一提供给 AI 客户端。</p>
                <span class="hm-tag">Node.js · MCP</span>
              </div>
            </router-link>
            <router-link to="/about" class="hm-proj">
              <div class="bezel-core">
      <svg class="proj-svg" viewBox="0 0 420 150" aria-hidden="true" focusable="false">
        <g class="pv-grid">
          <path d="M0 30 H420 M0 60 H420 M0 90 H420 M0 120 H420" />
          <path d="M60 0 V150 M140 0 V150 M220 0 V150 M300 0 V150 M380 0 V150" />
        </g>
        <g class="pv-dots">
          <circle cx="196" cy="94" r="2.6" />
          <circle cx="67" cy="45" r="1.8" />
          <circle cx="246" cy="81" r="1.8" />
          <circle cx="216" cy="90" r="1.8" />
          <circle cx="300" cy="85" r="1.8" />
          <circle cx="116" cy="88" r="1.8" />
          <circle cx="190" cy="92" r="1.8" />
          <circle cx="277" cy="95" r="2.6" />
          <circle cx="106" cy="48" r="1.8" />
          <circle cx="222" cy="100" r="1.8" />
          <circle cx="215" cy="28" r="1.8" />
          <circle cx="153" cy="81" r="1.8" />
          <circle cx="229" cy="87" r="1.8" />
          <circle cx="238" cy="23" r="1.8" />
          <circle cx="286" cy="60" r="2.6" />
          <circle cx="203" cy="77" r="1.8" />
          <circle cx="72" cy="76" r="1.8" />
          <circle cx="300" cy="86" r="1.8" />
          <circle cx="173" cy="74" r="1.8" />
          <circle cx="363" cy="73" r="1.8" />
          <circle cx="216" cy="23" r="1.8" />
          <circle cx="154" cy="87" r="2.6" />
          <circle cx="349" cy="31" r="1.8" />
          <circle cx="254" cy="72" r="1.8" />
          <circle cx="230" cy="83" r="1.8" />
          <circle cx="194" cy="72" r="1.8" />
          <circle cx="365" cy="129" r="1.8" />
          <circle cx="210" cy="69" r="1.8" />
          <circle cx="318" cy="75" r="2.6" />
          <circle cx="202" cy="117" r="1.8" />
          <circle cx="174" cy="56" r="1.8" />
          <circle cx="266" cy="86" r="1.8" />
          <circle cx="195" cy="78" r="1.8" />
          <circle cx="173" cy="77" r="1.8" />
        </g>
        <g class="pv-label">
          <text x="16" y="134">乐清市 · 34 站点</text>
          <text x="404" y="134" text-anchor="end" class="pv-sub">PostGIS</text>
        </g>
      </svg>
                <h3 class="hm-proj-title">乐清市充电桩分布图</h3>
                <p class="hm-text">充电桩空间分布可视化，从 SQLite 升级到 Docker + PostGIS 架构。</p>
                <span class="hm-tag">PostGIS · Docker</span>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <div class="hm">
      <!-- 最近 / 热门 -->
      <section class="hm-sec hm-sec-last">
        <div class="hm-2up">
          <div class="hm-sec--pair">
            <h2 class="hm-h">最近更新</h2>
            <ul class="hm-list">
              <li v-for="p in posts.slice(0, 4)" :key="p.id">
                <router-link :to="`/post/${p.slug || p.id}`">
                  <div class="bezel-core">
                    <span class="hm-li-t">{{ p.title }}</span><span class="hm-li-d">{{ p.date?.slice(5) }}</span>
                  </div>
                </router-link>
              </li>
            </ul>
          </div>
          <div class="hm-sec--pair">
            <h2 class="hm-h">热门</h2>
            <ul class="hm-list">
              <li v-for="p in popular" :key="p.id">
                <router-link :to="`/post/${p.slug || p.id}`">
                  <div class="bezel-core">
                    <span class="hm-li-t">{{ p.title }}</span><span class="hm-li-d">{{ p.views }}</span>
                  </div>
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
    <SiteFooter command='echo "© 2026 woodwhite@blog — 技术论坛"' />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { stripMarkdown } from '../../utils/excerpt.js'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import UserAvatar from '../common/UserAvatar.vue'
import { useAuth } from '../../stores/auth.js'
import { usePosts } from '../../composables/usePosts.js'

const route = useRoute()
const navOpen = ref(false)
const router = useRouter()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

// 站点统计 + 热门文章
const stats = ref({ posts: 0, views: 0, comments: 0, tags: 0, byMonth: [] })
const popular = ref([])
const maxMonth = computed(() => Math.max(1, ...(stats.value.byMonth || []).map(m => m.c)))
async function loadExtra() {
  try {
    const [a, b] = await Promise.all([
      fetch('/api/stats').then(r => r.ok ? r.json() : null),
      fetch('/api/posts?page=1&status=published&sort=popular').then(r => r.ok ? r.json() : null),
    ])
    if (a) stats.value = a
    if (b) popular.value = (b.posts || []).slice(0, 3)
  } catch {}
}

// ====== 文章数据层（取数/分页/筛选/搜索/标签/作者统计） ======
const {
  posts, loading, loadingMore, error, currentPage, totalPages,
  tags, contributors, totalPublished, sortMode,
  pinnedPost, hasMore, activeTag, activeSearch,
  clearTagLink, clearSearchLink,
  switchSort, loadMore, fetchPosts,
} = usePosts()

// 摘要纯文本化（数据库存量 excerpt 含 markdown 标记，渲染时剥离）
const cleanExcerpt = (txt) => stripMarkdown(txt, 180)
// 主题标签（首屏"这里写什么" + 关于区块分布图）
const topTags = computed(() => [...tags.value].sort((a, b) => Number(b.post_count) - Number(a.post_count)).slice(0, 5))
const topTags6 = computed(() => [...tags.value].sort((a, b) => Number(b.post_count) - Number(a.post_count)).slice(0, 6))
const maxTagCount = computed(() => Math.max(1, ...tags.value.map(t => Number(t.post_count) || 0)))

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

// ====== 首屏光标跟随光晕（仅精确指针设备，且尊重减少动效偏好）======
let heroBand = null
const onHeroMove = (e) => {
  if (!heroBand) return
  const r = heroBand.getBoundingClientRect()
  if (!r.width || !r.height) return
  heroBand.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%')
  heroBand.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%')
  if (!heroBand.classList.contains('glow-on')) heroBand.classList.add('glow-on')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadExtra()
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (fine && !calm) {
    heroBand = document.querySelector('.hero-band')
    if (heroBand) heroBand.addEventListener('pointermove', onHeroMove, { passive: true })
  }
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (heroBand) heroBand.removeEventListener('pointermove', onHeroMove)
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
/* ===== 信笺风覆盖（2026-10-11）===== */
.hero-inner { max-width: 860px; padding: 112px 24px 92px; }
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

/* 信笺统一（组件内，替代原全局 !important）*/
.sidebar-panel { background: transparent; border: 1px solid var(--border); border-radius: 4px; box-shadow: none; padding: 6px; }
.panel-bar { border-bottom: 1px solid var(--border); background: transparent; padding: 14px 18px 12px; }
.panel-body { padding: 14px 18px 18px; }
.panel-title { font-family: var(--font-hand); font-size: 17px; font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--text-bright); }
.info-key { color: var(--text-dim); }

.sort-bar { padding: 12px 18px; }
.sort-btn { padding: 6px 14px; }

/* 首页最近更新（信笺风）*/
.home-recent { margin: 0; padding: 0; }
.home-recent-title { font-family: var(--font-hand); font-size: 24px; font-weight: 400; color: var(--text-bright); margin: 0 0 8px; }
.recent-list { list-style: none; margin: 0 0 20px; padding: 0; }
.recent-list li { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.recent-link { font-size: 17px; color: var(--text); text-decoration: none; transition: color .2s; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-link:hover { color: var(--accent); }
.recent-date { font-size: 13px; color: var(--text-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }
.home-stats { font-size: 14px; color: var(--text-dim); margin: 0; }
.stats-link { color: var(--accent); text-decoration: none; }
.stats-link:hover { text-decoration: underline; }

/* 首页 现在 / 友链 */
.home-now, .home-links { margin: 0; padding: 0; }
.home-now-title, .home-links-title { font-family: var(--font-hand); font-size: 24px; font-weight: 400; color: var(--text-bright); margin: 0 0 10px; }
.home-now-text { font-size: 17px; line-height: 1.95; color: var(--text-secondary); max-width: 620px; margin: 0; }
.friend-list { display: flex; flex-wrap: wrap; align-items: baseline; gap: 16px; }
.friend-item { font-size: 16px; color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; padding-bottom: 2px; transition: border-color .2s; }
.friend-item:hover { border-color: var(--accent); }
.friend-empty { font-size: 14px; color: var(--text-dim); }

/* 首页 热门文章 / 写作活动 */
.home-popular { margin: 0; padding: 0; }
.home-activity { max-width: 860px; margin: 0 auto; padding: 0 24px 96px; }
.home-popular-title, .home-activity-title { font-family: var(--font-hand); font-size: 24px; font-weight: 400; color: var(--text-bright); margin: 0 0 16px; }
.popular-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.popular-card { display: flex; flex-direction: column; gap: 8px; padding: 20px 18px; border: 1px solid var(--border); border-radius: 4px; text-decoration: none; transition: border-color .25s, transform .25s; }
.popular-card:hover { border-color: var(--text-bright); transform: translateY(-2px); }
.popular-num { font-family: var(--font-hand); font-size: 20px; color: var(--text-faint); }
.popular-title { font-size: 16px; line-height: 1.5; color: var(--text-bright); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.popular-meta { font-size: 13px; color: var(--text-dim); margin-top: auto; }
.activity-grid { display: flex; align-items: flex-end; gap: 10px; height: 84px; margin-bottom: 14px; }
.activity-col { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.activity-bar { width: 22px; background: var(--accent); border-radius: 2px; opacity: .85; }
.activity-label { font-size: 12px; color: var(--text-dim); }
.activity-sum { font-size: 14px; color: var(--text-dim); margin: 0; font-variant-numeric: tabular-nums; }
@media (max-width: 700px) { .popular-grid { grid-template-columns: 1fr; } }

/* 首页两栏并排（打破纵向单调）*/
.home-cols { max-width: 860px; margin: 0 auto; padding: 0 24px 64px; display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: start; }
@media (max-width: 760px) { .home-cols { grid-template-columns: 1fr; gap: 40px; } }
</style>
