<template>
  <div class="tl-page">
    <SiteNav />

    <main class="tl-main">
      <header class="tl-head">
        <h1 class="tl-title">工具库</h1>
        <p class="tl-desc">
          按用途收的 AI 工具，一条一句话说清能干什么。默认列全部，标了「站长精选」的是我自己在用的。
        </p>

        <div class="tl-search-row">
          <label class="tl-search-label" for="tools-q">搜索工具</label>
          <input
            id="tools-q"
            v-model="q"
            class="tl-search"
            type="search"
            placeholder="名称、用途、标签，例如：本地、语音、PDF"
            autocomplete="off"
          />
        </div>

        <nav class="tl-cats" aria-label="按用途筛选">
          <button
            type="button"
            class="tl-cat"
            :class="{ active: category === '' }"
            :aria-pressed="category === ''"
            @click="pickCategory('')"
          >全部</button>
          <button
            v-for="c in categories"
            :key="c.key"
            type="button"
            class="tl-cat"
            :class="{ active: category === c.key }"
            :aria-pressed="category === c.key"
            @click="pickCategory(c.key)"
          >{{ c.label }}<span class="tl-cat-n">{{ c.count }}</span></button>
        </nav>

        <div class="tl-filters">
          <label class="tl-check"><input v-model="freeOnly" type="checkbox" @change="reload" /> 免费可用</label>
          <label class="tl-check"><input v-model="noKey" type="checkbox" @change="reload" /> 不用自备 key</label>
          <label class="tl-check"><input v-model="zhUi" type="checkbox" @change="reload" /> 有中文界面</label>

          <span class="tl-spacer" />

          <label class="tl-sort-label" for="tools-sort">排序</label>
          <select id="tools-sort" v-model="sort" class="tl-sort" @change="reload">
            <option value="featured">精选优先</option>
            <option value="stars">星数</option>
            <option value="gain">七日涨幅</option>
            <option value="new">最近收录</option>
          </select>

          <button
            type="button"
            class="tl-mode"
            :class="{ active: mode === 'all' }"
            :aria-pressed="mode === 'all'"
            @click="toggleMode"
          >{{ mode === 'all' ? '只看站长精选' : '看全部' }}</button>
        </div>
      </header>

      <p v-if="loading || total > 0" class="tl-status" role="status" aria-live="polite">
        {{ loading ? '加载中…' : `共 ${total} 个工具` }}
      </p>

      <div v-if="!loading && items.length === 0" class="tl-empty">
        <p v-if="mode === 'featured'">这个组合下还没点亮过精选。</p>
        <p v-else>这个组合下没有工具，换个分类或去掉几个勾选试试。</p>
        <button v-if="mode === 'featured'" type="button" class="tl-empty-btn" @click="toggleMode">
          看全部
        </button>
      </div>

      <ul v-else class="tl-grid">
        <li v-for="it in items" :key="it.slug" class="tl-card">
          <div class="tl-card-top">
            <RouterLink class="tl-name" :to="`/tools/${it.slug}`">{{ it.name }}</RouterLink>
            <span v-if="it.featured" class="tl-badge on">站长精选</span>
            <span class="tl-stars" :title="`GitHub ${it.stars} stars`">
              ★ {{ formatStars(it.stars) }}
              <span v-if="it.star_gain_7d > 0" class="tl-gain">+{{ formatStars(it.star_gain_7d) }}</span>
            </span>
          </div>

          <p class="tl-tagline">{{ it.tagline_zh || it.desc_en || '暂无简介' }}</p>

          <p v-if="it.note_zh" class="tl-note">{{ it.note_zh }}</p>

          <div class="tl-meta">
            <span class="tl-cat-tag">{{ it.category_label }}</span>
            <span v-for="t in tagsOf(it)" :key="t" class="tl-tag">{{ t }}</span>
          </div>

          <p class="tl-facts">
            {{ formLabel(it.form) }}<template v-if="it.pricing !== 'free'"> · {{ pricingLabel(it.pricing) }}</template>
            <template v-if="it.needs_key"> · 需自备 key</template>
            <template v-if="it.zh_ui"> · 中文界面</template>
          </p>

          <div class="tl-links">
            <a :href="it.url" target="_blank" rel="noopener">主页</a>
            <a v-if="it.repo" :href="`https://github.com/${it.repo}`" target="_blank" rel="noopener">仓库</a>
            <RouterLink :to="`/tools/${it.slug}`">详情</RouterLink>
          </div>
        </li>
      </ul>

      <div v-if="items.length < total" class="tl-more-wrap">
        <button type="button" class="tl-more" :disabled="loading" @click="loadMore">加载更多</button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'

const route = useRoute()
const router = useRouter()

const oneOf = (v, list, dflt) => (typeof v === 'string' && list.includes(v) ? v : dflt)
const strOr = (v, dflt = '') => (typeof v === 'string' ? v : dflt)

const items = ref([])
const total = ref(0)
const categories = ref([])
const loading = ref(false)
const mode = ref(route.query.mode === 'featured' ? 'featured' : 'all')
const category = ref(strOr(route.query.category))
const q = ref(strOr(route.query.q))
const sort = ref(oneOf(route.query.sort, ['featured', 'stars', 'gain', 'new'], 'featured'))
const freeOnly = ref(route.query.free === '1')
const noKey = ref(route.query.no_key === '1')
const zhUi = ref(route.query.zh_ui === '1')
const page = ref(1)
const LIMIT = 24

const FORMS = { web: '网页', desktop: '桌面', cli: '命令行', library: '开发库', model: '模型', plugin: '插件' }
const PRICING = { freemium: '免费额度', paid: '付费', api: '只卖 API', free: '免费' }
const formLabel = (f) => FORMS[f] || f
const pricingLabel = (p) => PRICING[p] || p
const tagsOf = (it) => it.tags.filter((t) => t !== it.category_label).slice(0, 3)

const formatStars = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))

let reqId = 0

async function load(append = false) {
  const myReq = ++reqId
  loading.value = true
  const params = new URLSearchParams({ mode: mode.value, sort: sort.value, page: String(page.value), limit: String(LIMIT) })
  if (category.value) params.set('category', category.value)
  if (q.value.trim()) params.set('q', q.value.trim())
  if (freeOnly.value) params.set('free', '1')
  if (noKey.value) params.set('no_key', '1')
  if (zhUi.value) params.set('zh_ui', '1')

  try {
    const res = await fetch(`/api/ai-tools?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    if (myReq !== reqId) return // 有更新的请求在路上，丢弃这次结果
    items.value = append ? [...items.value, ...data.items] : data.items
    total.value = data.total
    categories.value = data.categories || []
  } catch (err) {
    if (myReq === reqId) {
      items.value = []
      total.value = 0
      console.error('工具库加载失败', err)
    }
  } finally {
    if (myReq === reqId) loading.value = false
  }
}

// 筛选状态写回 URL：可分享、可收藏，也为后面的分类页 SEO 铺路
function syncQuery() {
  const query = {}
  if (mode.value === 'featured') query.mode = 'featured'
  if (category.value) query.category = category.value
  if (q.value.trim()) query.q = q.value.trim()
  if (sort.value !== 'featured') query.sort = sort.value
  if (freeOnly.value) query.free = '1'
  if (noKey.value) query.no_key = '1'
  if (zhUi.value) query.zh_ui = '1'
  router.replace({ query })
}

function reload() {
  page.value = 1
  syncQuery()
  load(false)
}

function loadMore() {
  page.value += 1
  load(true)
}

function pickCategory(key) {
  category.value = key
  reload()
}

function toggleMode() {
  mode.value = mode.value === 'featured' ? 'all' : 'featured'
  reload()
}

let debounce
watch(q, () => {
  clearTimeout(debounce)
  debounce = setTimeout(reload, 260)
})

onMounted(reload)
</script>

<style scoped>
.tl-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.tl-main { max-width: 1080px; margin: 0 auto; padding: 72px 24px 112px; }

.tl-head { padding-bottom: 18px; border-bottom: 1px solid var(--border); }
.tl-title {
  margin: 0 0 10px; font-size: clamp(26px, 3.2vw, 34px); font-weight: 600;
  letter-spacing: -.015em; text-wrap: balance;
}
.tl-desc { margin: 0 0 20px; max-width: 62ch; font-size: 14px; line-height: 1.75; color: var(--text-dim); }

.tl-search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.tl-search-label { font-size: 13px; color: var(--text-dim); white-space: nowrap; }
.tl-search {
  flex: 1; min-width: 0; font: inherit; font-size: 14px; padding: 8px 12px; border-radius: 6px;
  border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text);
}
.tl-search::placeholder { color: var(--text-faint); }
.tl-search:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }

.tl-cats { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px; }
.tl-cat {
  appearance: none; background: none; border: 1px solid transparent; border-radius: 6px;
  padding: 5px 11px; font: inherit; font-size: 13px; color: var(--text-dim); cursor: pointer;
  transition: color .12s ease, border-color .12s ease;
}
.tl-cat:hover { color: var(--text); }
.tl-cat.active { color: var(--text); border-color: var(--border-strong); }
.tl-cat:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tl-cat-n { margin-left: 6px; font-size: 12px; color: var(--text-faint); font-variant-numeric: tabular-nums; }

.tl-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
.tl-check { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); cursor: pointer; }
.tl-check input { accent-color: var(--accent); }
.tl-check input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tl-spacer { flex: 1; }
.tl-sort-label { font-size: 13px; color: var(--text-dim); }
.tl-sort {
  font: inherit; font-size: 13px; padding: 5px 8px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent; color: var(--text);
}
.tl-sort:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tl-mode {
  appearance: none; font: inherit; font-size: 13px; padding: 5px 12px; border-radius: 6px;
  border: 1px solid var(--border); background: none; color: var(--text-dim); cursor: pointer;
  transition: color .12s ease, border-color .12s ease;
}
.tl-mode:hover { color: var(--text); }
.tl-mode.active { color: var(--text); border-color: var(--border-strong); }
.tl-mode:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.tl-status { margin: 18px 0 14px; font-size: 12px; color: var(--text-faint); font-variant-numeric: tabular-nums; }

.tl-empty { padding: 40px 0; border-top: 1px solid var(--border); color: var(--text-dim); font-size: 14px; line-height: 1.8; }
.tl-empty p { margin: 0 0 12px; }
.tl-empty-btn {
  appearance: none; font: inherit; font-size: 13px; padding: 7px 14px; border-radius: 6px;
  border: 1px solid var(--border-strong); background: none; color: var(--text); cursor: pointer;
}
.tl-empty-btn:hover { border-color: var(--accent); color: var(--accent); }
.tl-empty-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.tl-grid {
  list-style: none; margin: 0; padding: 0; display: grid; gap: 1px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  background: var(--border); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
}
.tl-card {
  display: flex; flex-direction: column; gap: 8px; padding: 18px 20px 16px;
  background: var(--bg); min-width: 0;
  transition: background-color .12s ease;
}
.tl-card:hover { background: var(--bg-elevated); }

.tl-card-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.tl-name {
  font-size: 13px; font-weight: 600; color: var(--text-secondary); text-decoration: none;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
}
.tl-name:hover { color: var(--accent); }
.tl-name:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.tl-stars { flex: none; font-size: 12px; color: var(--text-faint); font-variant-numeric: tabular-nums; }
.tl-gain { color: var(--ok); margin-left: 2px; }

.tl-tagline {
  margin: 0; font-size: 15px; line-height: 1.6; color: var(--text-bright);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  text-wrap: pretty;
}
.tl-note {
  margin: 0; padding-left: 10px; border-left: 2px solid var(--border-strong);
  font-size: 13px; line-height: 1.6; color: var(--text-dim);
}

.tl-badge {
  flex: none; font-size: 11px; padding: 1px 6px; border-radius: 4px;
  border: 1px solid var(--border-strong); color: var(--text-faint);
}
.tl-badge.on { border-color: var(--accent); color: var(--accent); }
.tl-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: 12px; color: var(--text-faint); }
.tl-cat-tag { color: var(--accent); }
.tl-tag::before { content: "#"; opacity: .5; }
.tl-facts { margin: 0; font-size: 12px; color: var(--text-faint); }

.tl-links { display: flex; gap: 14px; margin-top: 2px; font-size: 12px; }
.tl-links a { color: var(--text-dim); text-decoration: none; }
.tl-links a:hover { color: var(--accent); }
.tl-links a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.tl-more-wrap { display: flex; justify-content: center; margin-top: 28px; }
.tl-more {
  appearance: none; font: inherit; font-size: 13px; padding: 8px 20px; border-radius: 6px;
  border: 1px solid var(--border-strong); background: none; color: var(--text); cursor: pointer;
}
.tl-more:hover { border-color: var(--accent); color: var(--accent); }
.tl-more:disabled { opacity: .5; cursor: default; }
.tl-more:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

@media (max-width: 640px) {
  .tl-main { padding: 56px 16px 88px; }
  .tl-grid { grid-template-columns: 1fr; }
  .tl-spacer { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .tl-card, .tl-cat, .tl-mode { transition: none; }
}
</style>
