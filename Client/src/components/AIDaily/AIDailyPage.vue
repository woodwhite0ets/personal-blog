<template>
  <div class="ad-page">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav />

    <main class="ad-main">
      <header class="ad-head">
        <h1 class="ad-title">AI 项目榜</h1>
        <p class="ad-desc">
          每天从 GitHub 抓约 200 个候选，按 24 小时 Star 增量排出今日榜；再按相对增速分出潜力与极客两池，中文简介由本机模型生成。
        </p>

        <dl class="ad-overview">
          <div class="ad-stat">
            <dt>今日收录</dt>
            <dd>{{ todayLoaded ? items.length : '—' }}</dd>
          </div>
          <div class="ad-stat">
            <dt>近 7 日项目</dt>
            <dd>{{ overview.fresh ?? '—' }}</dd>
          </div>
          <div class="ad-stat">
            <dt>极客池</dt>
            <dd>{{ geek.poolSize || '—' }}</dd>
          </div>
          <div class="ad-stat">
            <dt>harness 在榜</dt>
            <dd>{{ harness.stats.total ? formatNumber(harness.stats.total) : '—' }}</dd>
          </div>
        </dl>

        <nav class="ad-tabs" role="tablist" aria-label="榜单视图">
          <button
            v-for="tab in tabs" :key="tab.key" type="button" role="tab" class="ad-tab"
            :class="{ active: view === tab.key }" :aria-selected="view === tab.key"
            @click="switchView(tab.key)"
          >{{ tab.label }}</button>
        </nav>

        <div v-if="view === 'today'" class="ad-meta">
          <label class="ad-date-label" for="ad-date">榜单日期</label>
          <select
            id="ad-date" class="ad-select" :value="activeDate"
            :disabled="dates.length === 0" @change="onDateChange"
          >
            <option v-if="dates.length === 0" value="">暂无数据</option>
            <option v-for="d in dates" :key="d.date" :value="d.date">{{ d.date }} · {{ d.count }} 个</option>
          </select>
          <span v-if="updatedAtText" class="ad-updated">更新于 {{ updatedAtText }}</span>
        </div>
      </header>

      <!-- ==================== 今日 ==================== -->
      <section v-if="view === 'today'" class="ad-view-body">
        <div v-if="loading" class="ad-skeleton" aria-hidden="true">
          <div v-for="n in 5" :key="n" class="ad-skel-row">
            <span class="ad-skel-rank"></span>
            <span class="ad-skel-body">
              <span class="ad-skel-line w40"></span>
              <span class="ad-skel-line w80"></span>
            </span>
          </div>
          <p class="sr-only" role="status">榜单加载中</p>
        </div>

        <div v-else-if="error" class="ad-state">
          <p class="ad-state-title">榜单没有加载出来</p>
          <p class="ad-state-body">接口返回了错误，稍后刷新重试；如果一直失败，说明当天的采集任务可能没跑成功。</p>
          <button class="ad-retry" type="button" @click="load(activeDate)">重新加载</button>
        </div>

        <div v-else-if="items.length === 0" class="ad-state">
          <p class="ad-state-title">这一天还没有榜单</p>
          <p class="ad-state-body">采集任务每天上午运行一次，完成后这里会出现当天的 12 个项目。</p>
        </div>

        <Transition v-else name="adfade" mode="out-in">
        <ol :key="date" class="ad-list">
          <li v-for="item in items" :key="item.repo" class="ad-row">
            <span class="ad-rank" aria-hidden="true">{{ String(item.rank).padStart(2, '0') }}</span>
            <div class="ad-body">
              <div class="ad-line">
                <a class="ad-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
                <RouterLink v-if="item.tool_slug" class="ad-tool-link" :to="`/tools/${item.tool_slug}`">工具详情</RouterLink>
                <span v-if="item.language" class="ad-lang">{{ item.language }}</span>
                <span class="ad-stats">
                  <span class="ad-stars" :title="`总 Star ${formatNumber(item.stars)}`">★ {{ formatNumber(item.stars) }}</span>
                  <span v-if="item.star_gain > 0" class="ad-gain">+{{ formatNumber(item.star_gain) }}</span>
                  <span v-else-if="item.first_seen === activeDate" class="ad-new">新上榜</span>
                </span>
              </div>
              <p class="ad-summary">{{ item.desc_zh || item.desc_en || '这个项目还没有描述。' }}</p>
              <p v-if="item.topics" class="ad-topics">{{ item.topics.split(',').slice(0, 4).join(' · ') }}</p>
            </div>
          </li>
        </ol>
        </Transition>
      </section>

      <!-- ==================== 趋势 ==================== -->
      <section v-else-if="view === 'trends'" class="ad-view-body">
        <div v-if="trendsLoading" class="ad-state"><p class="ad-state-body" role="status">趋势加载中…</p></div>
        <div v-else-if="trendsError" class="ad-state">
          <p class="ad-state-title">趋势没有加载出来</p>
          <button class="ad-retry" type="button" @click="loadTrends(true)">重新加载</button>
        </div>
        <template v-else>
          <h2 class="ad-h2">本周 Top<em>按近 7 日累计增星</em></h2>
          <ol v-if="week.items.length" class="ad-list">
            <li v-for="item in week.items" :key="'w-' + item.repo" class="ad-row">
              <span class="ad-rank" aria-hidden="true">{{ String(item.rank).padStart(2, '0') }}</span>
              <div class="ad-body">
                <div class="ad-line">
                  <a class="ad-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
                <RouterLink v-if="item.tool_slug" class="ad-tool-link" :to="`/tools/${item.tool_slug}`">工具详情</RouterLink>
                  <span v-if="item.language" class="ad-lang">{{ item.language }}</span>
                  <span class="ad-stats">
                    <span class="ad-stars">★ {{ formatNumber(item.stars) }}</span>
                    <span v-if="item.gain > 0" class="ad-gain">+{{ formatNumber(item.gain) }}</span>
                  </span>
                </div>
                <p class="ad-summary">{{ item.desc_zh || item.desc_en || '这个项目还没有描述。' }}</p>
                <p class="ad-topics">窗口内上榜 {{ item.hits }} 次 · 首次收录 {{ item.firstSeen }}</p>
              </div>
            </li>
          </ol>
          <p v-else class="ad-state-body">本周还没有足够的快照。</p>

          <h2 class="ad-h2">每日增星<em>窗口内日增总量</em></h2>
          <ul class="ad-bars">
            <li v-for="d in insights.daily" :key="d.date" class="ad-bar-row">
              <span class="ad-bar-name">{{ d.date.slice(5) }}</span>
              <span class="ad-bar-track"><span class="ad-bar-fill" :style="{ width: ratio(d.gain, dailyMax) }"></span></span>
              <span class="ad-bar-value">+{{ formatNumber(d.gain) }} · {{ d.repos }} 个项目</span>
            </li>
          </ul>

          <div class="ad-columns">
            <div class="ad-col">
              <h2 class="ad-h2">名次跃升<em>窗口首日 → 最新</em></h2>
              <ul v-if="insights.risers.length" class="ad-bars">
                <li v-for="r in insights.risers" :key="'r-' + r.repo" class="ad-bar-row single">
                  <span class="ad-bar-name">{{ r.repo }}</span>
                  <span class="ad-bar-value">{{ r.from }} → {{ r.to }} · 升 {{ r.delta }} 位</span>
                </li>
              </ul>
              <p v-else class="ad-state-body">窗口内名次没有变化。</p>

              <h2 class="ad-h2">连续在榜<em>上榜天数</em></h2>
              <ul class="ad-bars">
                <li v-for="s in insights.streaks" :key="'s-' + s.repo" class="ad-bar-row single">
                  <span class="ad-bar-name">{{ s.repo }}</span>
                  <span class="ad-bar-value">{{ s.appearances }} 天 · +{{ formatNumber(s.gain) }}</span>
                </li>
              </ul>
            </div>

            <div class="ad-col">
              <h2 class="ad-h2">语言分布<em>项目数 · 累计增星</em></h2>
              <ul class="ad-bars">
                <li v-for="l in insights.languages" :key="l.language" class="ad-bar-row">
                  <span class="ad-bar-name">{{ l.language }}</span>
                  <span class="ad-bar-track"><span class="ad-bar-fill" :style="{ width: ratio(l.count, languagesMax) }"></span></span>
                  <span class="ad-bar-value">{{ l.count }} 个 · +{{ formatNumber(l.gain) }}</span>
                </li>
              </ul>

              <h2 class="ad-h2">主题标签<em>出现次数</em></h2>
              <p class="ad-pills">
                <span v-for="t in insights.topics" :key="t.topic" class="ad-pill">{{ t.topic }}<em>{{ t.count }}</em></span>
              </p>
            </div>
          </div>

          <p v-if="insights.biggestDay" class="ad-footnote">
            单日最大涨幅：{{ insights.biggestDay.repo }} +{{ formatNumber(insights.biggestDay.gain) }}（{{ insights.biggestDay.date }}）
          </p>
        </template>
      </section>

      <!-- ==================== 发现 ==================== -->
      <section v-else-if="view === 'discover'" class="ad-view-body">
        <div v-if="discoverLoading" class="ad-state"><p class="ad-state-body" role="status">发现页加载中…</p></div>
        <div v-else-if="discoverError" class="ad-state">
          <p class="ad-state-title">发现页没有加载出来</p>
          <button class="ad-retry" type="button" @click="loadDiscover(true)">重新加载</button>
        </div>
        <template v-else>
          <div class="ad-columns">
            <div class="ad-col">
              <h2 class="ad-h2">潜力项目<em>按相对增速，近 7 日涨幅 / 当前星数</em></h2>
              <ol v-if="analysis.emerging.length" class="ad-list compact">
                <li v-for="(item, i) in analysis.emerging" :key="'e-' + item.repo" class="ad-row">
                  <span class="ad-rank" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
                  <div class="ad-body">
                    <div class="ad-line">
                      <a class="ad-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
                <RouterLink v-if="item.tool_slug" class="ad-tool-link" :to="`/tools/${item.tool_slug}`">工具详情</RouterLink>
                      <span class="ad-stats">
                        <span class="ad-momentum">+{{ item.momentumPct }}%</span>
                        <span class="ad-stars">★ {{ formatNumber(item.stars) }}</span>
                      </span>
                    </div>
                    <p class="ad-summary">{{ item.desc || '这个项目还没有描述。' }}</p>
                    <p class="ad-topics">
                      {{ item.language || '未标注' }} · 上榜 {{ item.appearances }} 天
                      <template v-if="item.ageDays !== null && item.ageDays !== undefined"> · 库龄 {{ item.ageDays }} 天</template>
                    </p>
                  </div>
                </li>
              </ol>
              <p v-else class="ad-state-body">还没有满足条件的潜力项目，再跑几天数据会更准。</p>

              <h2 class="ad-h2">成熟项目<em>Star ≥ 3 万且库龄 ≥ 1 年，按累计增星</em></h2>
              <ul class="ad-bars">
                <li v-for="m in analysis.mature" :key="'m-' + m.repo" class="ad-bar-row single">
                  <span class="ad-bar-name">{{ m.repo }}</span>
                  <span class="ad-bar-value">★ {{ formatNumber(m.stars) }} · +{{ formatNumber(m.gain) }}</span>
                </li>
              </ul>
            </div>

            <div class="ad-col">
              <h2 class="ad-h2">极客池<em>homelab / tui / embedded / fpga / emulator，星数 120–8,000</em></h2>
              <ol v-if="geek.items.length" class="ad-list compact">
                <li v-for="(item, i) in geek.items" :key="'g-' + item.repo" class="ad-row">
                  <span class="ad-rank" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
                  <div class="ad-body">
                    <div class="ad-line">
                      <a class="ad-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
                <RouterLink v-if="item.tool_slug" class="ad-tool-link" :to="`/tools/${item.tool_slug}`">工具详情</RouterLink>
                      <span class="ad-stats">
                        <span class="ad-stars">★ {{ formatNumber(item.stars) }}</span>
                        <span v-if="item.gain > 0" class="ad-gain">+{{ formatNumber(item.gain) }}</span>
                      </span>
                    </div>
                    <p class="ad-summary">{{ item.desc || '这个项目还没有描述。' }}</p>
                    <p class="ad-topics">
                      {{ item.language || '未标注' }}
                      <template v-if="item.topics"> · {{ item.topics.split(',').slice(0, 3).join(' · ') }}</template>
                    </p>
                  </div>
                </li>
              </ol>
              <p v-else class="ad-state-body">极客池还是空的，跑过一次采集后这里会有数据。</p>
            </div>
          </div>
        </template>
      </section>

      <!-- ==================== harness 用量（OpenRouter /apps 榜） ==================== -->
      <section v-else class="ad-view-body">
        <div v-if="harnessLoading" class="ad-state"><p class="ad-state-body" role="status">harness 榜加载中…</p></div>
        <div v-else-if="harnessError" class="ad-state">
          <p class="ad-state-title">harness 榜没有加载出来</p>
          <button class="ad-retry" type="button" @click="loadHarness(true)">重新加载</button>
        </div>
        <template v-else>
          <p class="ad-note">
            数据来自 OpenRouter /apps 公开榜（快照 {{ harness.date || '—' }}）：共 {{ formatNumber(harness.stats.total) }} 个 harness 在榜，
            累计 {{ formatNumber(harness.stats.totalRequests) }} 次调用。榜上算的是「谁在通过 OpenRouter 调模型」，不是模型本身。
          </p>

          <h2 class="ad-h2">按累计 token 量<em>top {{ harness.top.length }}</em></h2>
          <ul class="ad-bars">
            <li v-for="h in harness.top" :key="'h-' + h.slug" class="ad-bar-row">
              <a
                class="ad-bar-name ad-harness-name"
                :href="h.url || '#'"
                target="_blank"
                rel="noopener noreferrer"
              >{{ h.title }}<span v-if="h.mine" class="ad-harness-mine">本站在用</span></a>
              <span class="ad-bar-track"><span class="ad-bar-fill" :style="{ width: ratio(h.tokens, harness.stats.maxTokens) }"></span></span>
              <span class="ad-bar-value">{{ formatTokens(h.tokens) }}</span>
            </li>
          </ul>

          <h2 class="ad-h2">增速最快<em>OpenRouter 近期</em></h2>
          <ul class="ad-bars">
            <li v-for="h in harness.trending" :key="'t-' + h.slug" class="ad-bar-row single">
              <a
                class="ad-bar-name ad-harness-name"
                :href="h.url || '#'"
                target="_blank"
                rel="noopener noreferrer"
              >{{ h.title }}<span v-if="h.mine" class="ad-harness-mine">本站在用</span></a>
              <span class="ad-bar-value">+{{ h.growthPct }}%</span>
            </li>
          </ul>

          <p class="ad-note ad-note-fine">
            统计口径：OpenRouter 只统计经它路由的调用，直连官方 API 的量不在内；榜单按累计量排，新上线的 harness 会偏低。
            本站自己用的是 pi / omp / DeepSeek Harness / Codex / Claude Code，命中会在后面标「本站在用」。
          </p>
        </template>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'

const tabs = [
  { key: 'today', label: '今日' },
  { key: 'trends', label: '趋势' },
  { key: 'discover', label: '发现' },
  { key: 'models', label: 'harness' },
]

const route = useRoute()
const router = useRouter()

// tab 与日期进 URL：可分享、刷新不丢
const VIEWS = ['today', 'trends', 'discover', 'models']
const initialView = VIEWS.includes(route.query.view) ? route.query.view : 'today'
const view = ref(initialView)

// 今日
const items = ref([])
const dates = ref([])
const activeDate = ref(typeof route.query.date === 'string' ? route.query.date : '')
const updatedAt = ref(null)
const loading = ref(true)
const error = ref(false)
const todayLoaded = ref(false)

// 趋势
const week = ref({ days: 7, snapshots: 0, from: null, to: null, items: [] })
const insights = ref({ days: 7, totals: {}, daily: [], languages: [], topics: [], risers: [], streaks: [], biggestDay: null })
const trendsLoading = ref(false)
const trendsError = ref(false)
let trendsLoaded = false

// 发现
const analysis = ref({ days: 7, mature: [], emerging: [], criteria: {} })
const geek = ref({ date: null, range: null, poolSize: 0, items: [] })
const discoverLoading = ref(false)
const discoverError = ref(false)
let discoverLoaded = false

// harness 用量（OpenRouter /apps 榜）
const harness = ref({ date: null, stats: { total: 0, maxTokens: 0, totalRequests: 0 }, top: [], trending: [] })
const harnessLoading = ref(false)
const harnessError = ref(false)
let harnessLoaded = false

const updatedAtText = computed(() => {
  if (!updatedAt.value) return ''
  const d = new Date(updatedAt.value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

const overview = computed(() => ({
  fresh: insights.value.totals?.distinctRepos ?? null,
}))

const dailyMax = computed(() => Math.max(1, ...(insights.value.daily || []).map((d) => d.gain)))
const languagesMax = computed(() => Math.max(1, ...(insights.value.languages || []).map((l) => l.count)))
const harnessMax = computed(() => Math.max(1, Number(harness.value.stats.maxTokens) || 1))

function ratio(value, max) {
  const pct = Math.max(2, Math.round(((Number(value) || 0) / (max || 1)) * 100))
  return `${Math.min(pct, 100)}%`
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US')
}

function formatTokens(n) {
  const v = Number(n) || 0
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `${Math.round(v / 1e3)}K`
  return String(v)
}

function formatContext(n) {
  const v = Number(n) || 0
  if (v >= 1000000) return `${Number((v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1))}M`
  if (v >= 1000) return `${Math.round(v / 1000)}K`
  return String(v)
}

async function load(date = '') {
  loading.value = true
  error.value = false
  try {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    params.set('limit', '20')
    const res = await fetch(`/api/ai-daily?${params.toString()}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    items.value = data.items || []
    activeDate.value = data.date || ''
    updatedAt.value = data.updatedAt || null
    todayLoaded.value = true
  } catch (err) {
    console.error('加载 AI 项目榜失败:', err)
    items.value = []
    error.value = true
  } finally {
    loading.value = false
  }
}

async function loadDates() {
  try {
    const res = await fetch('/api/ai-daily/dates?limit=30')
    if (!res.ok) return
    const data = await res.json()
    dates.value = data.dates || []
  } catch (err) {
    console.error('加载归档日期失败:', err)
  }
}

function onDateChange(event) {
  const next = event.target.value
  if (next) { load(next); syncQuery() }
}

async function loadTrends(force = false) {
  if (trendsLoaded && !force) return
  trendsLoading.value = true
  trendsError.value = false
  try {
    const [wRes, iRes] = await Promise.all([
      fetch('/api/ai-daily/weekly?days=7&limit=8'),
      fetch('/api/ai-daily/insights?days=7'),
    ])
    if (!wRes.ok || !iRes.ok) throw new Error(`HTTP ${wRes.status}/${iRes.status}`)
    week.value = await wRes.json()
    const ins = await iRes.json()
    insights.value = {
      days: ins.days || 7,
      totals: ins.totals || {},
      daily: ins.daily || [],
      languages: ins.languages || [],
      topics: ins.topics || [],
      risers: ins.risers || [],
      streaks: ins.streaks || [],
      biggestDay: ins.biggestDay || null,
    }
    trendsLoaded = true
  } catch (err) {
    console.error('加载趋势失败:', err)
    trendsError.value = true
  } finally {
    trendsLoading.value = false
  }
}

async function loadDiscover(force = false) {
  if (discoverLoaded && !force) return
  discoverLoading.value = true
  discoverError.value = false
  try {
    const [aRes, gRes] = await Promise.all([
      fetch('/api/ai-daily/analysis?days=7'),
      fetch('/api/ai-daily/geek?limit=12'),
    ])
    if (!aRes.ok || !gRes.ok) throw new Error(`HTTP ${aRes.status}/${gRes.status}`)
    const a = await aRes.json()
    analysis.value = {
      days: a.days || 7,
      criteria: a.criteria || {},
      mature: a.mature || [],
      emerging: a.emerging || [],
    }
    const g = await gRes.json()
    geek.value = {
      date: g.date || null,
      range: g.range || null,
      poolSize: g.poolSize || 0,
      items: g.items || [],
    }
    discoverLoaded = true
  } catch (err) {
    console.error('加载发现页失败:', err)
    discoverError.value = true
  } finally {
    discoverLoading.value = false
  }
}

async function loadHarness(force = false) {
  if (harnessLoaded && !force) return
  harnessLoading.value = true
  harnessError.value = false
  try {
    const res = await fetch('/api/ai-daily/harnesses?limit=12')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    harness.value = {
      date: data.date || null,
      stats: data.stats || { total: 0, maxTokens: 0, totalRequests: 0 },
      top: data.top || [],
      trending: data.trending || [],
    }
    harnessLoaded = true
  } catch (err) {
    console.error('加载 harness 榜失败:', err)
    harnessError.value = true
  } finally {
    harnessLoading.value = false
  }
}

function syncQuery(extra = {}) {
  const query = { ...route.query, ...extra }
  if (view.value === 'today') delete query.view; else query.view = view.value
  if (activeDate.value) query.date = activeDate.value; else delete query.date
  router.replace({ query })
}

async function switchView(next) {
  view.value = next
  syncQuery()
  if (next === 'trends') await loadTrends()
  if (next === 'discover') await loadDiscover()
  if (next === 'models') await loadHarness()
}

onMounted(async () => {
  await Promise.all([load(activeDate.value || undefined), loadDates()])
  // 概览里的「近 7 日新进」和「极客池」需要这两份数据，后台悄悄取一次
  loadTrends()
  loadDiscover()
  loadHarness()
})
</script>

<style scoped>
.ad-page { min-height: 100dvh; background-color: var(--bg); color: var(--text); }
.ad-main { max-width: var(--page-w); margin: 0 auto; padding: 64px var(--page-pad) 104px; }

/* 页头 */
.ad-head { padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.ad-title {
  margin: 0 0 10px;
  letter-spacing: -.015em; text-wrap: balance;
}
.ad-desc {
  margin: 0 0 22px; max-width: 62ch; font-size: 0.875rem; line-height: 1.75; color: var(--text-dim);
}

/* 概览数字：不做卡片，靠一条细线分隔 */
.ad-overview {
  display: flex; flex-wrap: wrap; gap: 28px 44px; margin: 0 0 22px;
  padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.ad-stat { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ad-stat dt { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-faint); letter-spacing: .06em; }
.ad-stat dd { margin: 0; font-size: 1.25rem; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }

/* 一级导航 */
.ad-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.ad-tab {
  appearance: none; background: none; border: 1px solid transparent; border-radius: 8px;
  padding: 6px 14px; font-size: 0.875rem; color: var(--text-dim); cursor: pointer;
  transition: color .12s ease, border-color .12s ease;
}
.ad-tab:hover { color: var(--text); }
.ad-tab.active { color: var(--text); border-color: var(--border); }
.ad-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-tool-link { font-size: 0.75rem; color: var(--text-faint); text-decoration: none; border-bottom: 1px solid var(--border-strong); }
.ad-tool-link:hover { color: var(--accent); border-bottom-color: var(--accent); }
.ad-tool-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.adfade-enter-active { transition: opacity var(--dur-pop) var(--ease-out); }
.adfade-leave-active { transition: opacity var(--dur-press) var(--ease-out); }
.adfade-enter-from, .adfade-leave-to { opacity: 0; }

.ad-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.ad-date-label { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .04em; color: var(--text-faint); }
.ad-meta > span:not(.ad-date-label):not(.ad-updated) { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .04em; color: var(--text-faint); }
.ad-select {
  font: inherit; font-size: 0.8125rem; padding: 5px 8px; border-radius: 8px;
  border: 1px solid var(--border); background: transparent; color: var(--text);
}
.ad-select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-updated { font-size: 0.75rem; color: var(--text-dim); font-variant-numeric: tabular-nums; }

/* 视图容器 */
.ad-view-body { padding-top: 26px; }
.ad-note {
  margin: 0 0 24px; padding-left: 14px; border-left: 2px solid var(--border);
  font-size: 0.8125rem; line-height: 1.75; color: var(--text-dim);
}
.ad-h2 {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  margin: 30px 0 14px; padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600;
  letter-spacing: .08em; color: var(--text-secondary);
}
.ad-h2:first-child { margin-top: 0; }
.ad-h2 em { font-style: normal; font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 400; color: var(--text-faint); letter-spacing: .04em; }
.ad-footnote {
  margin: 26px 0 0; padding-top: 14px; border-top: 1px solid var(--border);
  font-size: 0.75rem; color: var(--text-dim); font-variant-numeric: tabular-nums;
}

/* 两栏 */
.ad-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; }
.ad-col { min-width: 0; }
@media (max-width: 860px) {
  .ad-columns { grid-template-columns: 1fr; gap: 8px; }
}

/* 榜单行 */
.ad-list { list-style: none; margin: 0; padding: 0; }
.ad-row {
  display: grid; grid-template-columns: 34px 1fr; gap: 10px;
  padding: 15px 4px; border-bottom: 1px solid var(--border);
  transition: background-color var(--dur-hover) var(--ease-out);
  content-visibility: auto; contain-intrinsic-size: auto 92px;
}
.ad-list.compact .ad-row { padding: 11px 0; }
.ad-row:last-child { border-bottom: none; }
.ad-row:hover { background: var(--overlay-a2); }
.ad-rank { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .06em; color: var(--text-faint); font-variant-numeric: tabular-nums; padding-top: 3px; }
.ad-body { min-width: 0; }
.ad-line { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.ad-name {
  font-size: 0.875rem; font-weight: 500; color: var(--text); text-decoration: none;
  overflow-wrap: anywhere;
}
.ad-name:hover { text-decoration: underline; }
.ad-name:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
.ad-lang {
  font-size: 0.6875rem; color: var(--text-dim); border: 1px solid var(--border);
  border-radius: 4px; padding: 1px 6px;
}
.ad-stats {
  margin-left: auto; display: flex; align-items: baseline; gap: 10px;
  font-size: 0.75rem; color: var(--text-dim); font-variant-numeric: tabular-nums; white-space: nowrap;
}
.ad-stars { color: var(--text); }
.ad-gain { color: var(--text); }
.ad-new { border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }
.ad-momentum { color: var(--accent); font-weight: 600; }
.ad-summary { margin: 6px 0 0; font-family: var(--font-sans); font-size: 0.875rem; line-height: 1.7; color: var(--text-secondary); }
.ad-topics { margin: 6px 0 0; font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .03em; color: var(--text-faint); }

/* 条状分布 */
.ad-bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.ad-bar-row {
  display: grid; grid-template-columns: minmax(120px, 1.1fr) 1fr auto; align-items: center; gap: 12px;
  font-size: 0.8125rem;
}
.ad-bar-row.single { grid-template-columns: minmax(120px, 1.1fr) auto; }
.ad-bar-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* 去掉「填充轨道」观感：只留一条细柱，读作条形图而不是进度条 */
.ad-bar-track { height: 2px; border-radius: 0; background: none; overflow: visible; border-left: 1px solid var(--border-strong); }
.ad-bar-fill { display: block; height: 100%; background: var(--text-faint); }
.ad-bar-value { font-size: 0.75rem; color: var(--text-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* harness 榜：名字可点（去官方站点），本站在用的打一个标 */
.ad-harness-name { display: inline-flex; align-items: baseline; gap: 8px; color: var(--text-secondary); text-decoration: none; min-width: 0; }
.ad-harness-name:hover { color: var(--text-bright); }
.ad-harness-name:hover .ad-harness-mine { border-color: var(--accent); }
.ad-harness-mine {
  flex: none; font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .04em;
  color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  border-radius: 3px; padding: 0 4px;
}
.ad-note-fine { margin-top: 22px; color: var(--text-faint); }

/* 标签 */
.ad-pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
.ad-pill {
  font-size: 0.75rem; padding: 3px 9px; color: var(--text-dim);
  border: 1px solid var(--border); border-radius: 999px;
}
.ad-pill em { font-style: normal; margin-left: 5px; color: var(--text); font-variant-numeric: tabular-nums; }

/* 状态 */
.ad-state { padding: 40px 0; border-top: 1px solid var(--border); }
.ad-state-title { margin: 0 0 8px; font-size: 0.9375rem; font-weight: 600; }
.ad-state-body { margin: 0; font-size: 0.8125rem; line-height: 1.7; color: var(--text-dim); }
.ad-retry {
  margin-top: 14px; font: inherit; font-size: 0.8125rem; padding: 6px 14px; cursor: pointer;
  border: 1px solid var(--border); border-radius: 8px; background: transparent; color: var(--text);
}
.ad-retry:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* 骨架 */
.ad-skeleton { display: flex; flex-direction: column; gap: 18px; padding: 20px 0; }
.ad-skel-row { display: grid; grid-template-columns: 34px 1fr; gap: 10px; }
.ad-skel-rank { width: 14px; height: 10px; background: var(--border); border-radius: 4px; }
.ad-skel-body { display: flex; flex-direction: column; gap: 8px; }
.ad-skel-line { display: block; height: 10px; border-radius: 4px; background: var(--border); }
.ad-skel-line.w40 { width: 40%; }
.ad-skel-line.w80 { width: 80%; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

@media (max-width: 560px) {
  .ad-main { padding: 48px 16px 80px; }
  .ad-overview { gap: 18px 28px; }
  .ad-stats { margin-left: 0; width: 100%; }
  .ad-bar-row { grid-template-columns: 1fr auto; }
  .ad-bar-track { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ad-tab { transition: none; }
}
</style>
