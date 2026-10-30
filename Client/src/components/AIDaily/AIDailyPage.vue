<template>
  <div class="ad-page">
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
            <dt>近 7 日新进</dt>
            <dd>{{ overview.fresh ?? '—' }}</dd>
          </div>
          <div class="ad-stat">
            <dt>极客池</dt>
            <dd>{{ geek.poolSize || '—' }}</dd>
          </div>
          <div class="ad-stat">
            <dt>模型目录</dt>
            <dd>{{ models.stats.total ? formatNumber(models.stats.total) : '—' }}</dd>
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

        <ol v-else class="ad-list">
          <li v-for="item in items" :key="item.repo" class="ad-row">
            <span class="ad-rank" aria-hidden="true">{{ String(item.rank).padStart(2, '0') }}</span>
            <div class="ad-body">
              <div class="ad-line">
                <a class="ad-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
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
                  <span v-if="item.language" class="ad-lang">{{ item.language }}</span>
                  <span class="ad-stats">
                    <span class="ad-stars">★ {{ formatNumber(item.stars) }}</span>
                    <span v-if="item.gain > 0" class="ad-gain">+{{ formatNumber(item.gain) }}</span>
                  </span>
                </div>
                <p class="ad-summary">{{ item.desc_zh || item.desc_en || '这个项目还没有描述。' }}</p>
                <p class="ad-topics">本周上榜 {{ item.hits }} 次 · 首次 {{ item.firstSeen }}</p>
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

      <!-- ==================== 模型 ==================== -->
      <section v-else class="ad-view-body">
        <div v-if="modelsLoading" class="ad-state"><p class="ad-state-body" role="status">模型目录加载中…</p></div>
        <div v-else-if="modelsError" class="ad-state">
          <p class="ad-state-title">模型目录没有加载出来</p>
          <button class="ad-retry" type="button" @click="loadModels(true)">重新加载</button>
        </div>
        <template v-else>
          <p class="ad-note">
            数据来自 OpenRouter 公开模型目录（快照 {{ models.date || '—' }}）：共 {{ formatNumber(models.stats.total) }} 个模型，
            {{ formatNumber(models.stats.freeCount) }} 个可免费调用，最长上下文 {{ formatContext(models.stats.maxContext) }} tokens。
          </p>

          <div class="ad-columns">
            <div class="ad-col">
              <h2 class="ad-h2">最便宜的付费模型<em>$/百万输出 tokens</em></h2>
              <ul class="ad-bars">
                <li v-for="m in models.groups.cheap" :key="'c-' + m.model_id" class="ad-bar-row">
                  <span class="ad-bar-name">{{ m.name }}</span>
                  <span class="ad-bar-track"><span class="ad-bar-fill" :style="{ width: ratio(m.price_completion_per_m, priceMax) }"></span></span>
                  <span class="ad-bar-value">${{ m.price_completion_per_m ?? '—' }}</span>
                </li>
              </ul>
            </div>
            <div class="ad-col">
              <h2 class="ad-h2">超长上下文<em>按 tokens</em></h2>
              <ul class="ad-bars">
                <li v-for="m in models.groups.longest" :key="'l-' + m.model_id" class="ad-bar-row">
                  <span class="ad-bar-name">{{ m.name }}</span>
                  <span class="ad-bar-track"><span class="ad-bar-fill" :style="{ width: ratio(m.context_length, contextMax) }"></span></span>
                  <span class="ad-bar-value">{{ formatContext(m.context_length) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <h2 class="ad-h2">最近上架<em>按发布时间</em></h2>
          <ul class="ad-bars">
            <li v-for="m in models.groups.fresh" :key="'f-' + m.model_id" class="ad-bar-row single">
              <span class="ad-bar-name">{{ m.name }}</span>
              <span class="ad-bar-value">{{ m.released_on }} · {{ formatContext(m.context_length) }} · ${{ m.price_completion_per_m ?? '—' }}</span>
            </li>
          </ul>
        </template>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'

const tabs = [
  { key: 'today', label: '今日' },
  { key: 'trends', label: '趋势' },
  { key: 'discover', label: '发现' },
  { key: 'models', label: '模型' },
]

const view = ref('today')

// 今日
const items = ref([])
const dates = ref([])
const activeDate = ref('')
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

// 模型
const models = ref({ date: null, stats: {}, groups: { cheap: [], longest: [], fresh: [] } })
const modelsLoading = ref(false)
const modelsError = ref(false)
let modelsLoaded = false

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
const priceMax = computed(() => Math.max(1, ...(models.value.groups.cheap || []).map((m) => Number(m.price_completion_per_m) || 0)))
const contextMax = computed(() => Math.max(1, ...(models.value.groups.longest || []).map((m) => Number(m.context_length) || 0)))

function ratio(value, max) {
  const pct = Math.max(2, Math.round(((Number(value) || 0) / (max || 1)) * 100))
  return `${Math.min(pct, 100)}%`
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US')
}

function formatContext(n) {
  const v = Number(n) || 0
  if (v >= 1048576) return `${(v / 1048576).toFixed(v % 1048576 === 0 ? 0 : 1)}M`
  if (v >= 1024) return `${Math.round(v / 1024)}K`
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
  if (next) load(next)
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

async function loadModels(force = false) {
  if (modelsLoaded && !force) return
  modelsLoading.value = true
  modelsError.value = false
  try {
    const res = await fetch('/api/ai-daily/models?limit=8')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    models.value = {
      date: data.date || null,
      stats: data.stats || {},
      groups: data.groups || { cheap: [], longest: [], fresh: [] },
    }
    modelsLoaded = true
  } catch (err) {
    console.error('加载模型目录失败:', err)
    modelsError.value = true
  } finally {
    modelsLoading.value = false
  }
}

async function switchView(next) {
  view.value = next
  if (next === 'trends') await loadTrends()
  if (next === 'discover') await loadDiscover()
  if (next === 'models') await loadModels()
}

onMounted(async () => {
  await Promise.all([load(), loadDates()])
  // 概览里的「近 7 日新进」和「极客池」需要这两份数据，后台悄悄取一次
  loadTrends()
  loadDiscover()
  loadModels()
})
</script>

<style scoped>
.ad-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.ad-main { max-width: 1080px; margin: 0 auto; padding: 72px 24px 112px; }

/* 页头 */
.ad-head { padding-bottom: 20px; border-bottom: 1px solid var(--border); }
.ad-title {
  margin: 0 0 10px; font-size: clamp(26px, 3.2vw, 34px); font-weight: 600;
  letter-spacing: -.015em; text-wrap: balance;
}
.ad-desc {
  margin: 0 0 22px; max-width: 62ch; font-size: 14px; line-height: 1.75; color: var(--text-dim);
}

/* 概览数字：不做卡片，靠一条细线分隔 */
.ad-overview {
  display: flex; flex-wrap: wrap; gap: 28px 44px; margin: 0 0 22px;
  padding: 14px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
}
.ad-stat { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.ad-stat dt { font-size: 12px; color: var(--text-dim); letter-spacing: .02em; }
.ad-stat dd { margin: 0; font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }

/* 一级导航 */
.ad-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.ad-tab {
  appearance: none; background: none; border: 1px solid transparent; border-radius: 6px;
  padding: 6px 14px; font-size: 14px; color: var(--text-dim); cursor: pointer;
  transition: color .12s ease, border-color .12s ease;
}
.ad-tab:hover { color: var(--text); }
.ad-tab.active { color: var(--text); border-color: var(--border); }
.ad-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.ad-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.ad-date-label { font-size: 12px; color: var(--text-dim); }
.ad-select {
  font: inherit; font-size: 13px; padding: 5px 8px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent; color: var(--text);
}
.ad-select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-updated { font-size: 12px; color: var(--text-dim); font-variant-numeric: tabular-nums; }

/* 视图容器 */
.ad-view-body { padding-top: 26px; }
.ad-note {
  margin: 0 0 24px; padding-left: 14px; border-left: 2px solid var(--border);
  font-size: 13px; line-height: 1.75; color: var(--text-dim);
}
.ad-h2 {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  margin: 30px 0 14px; font-size: 15px; font-weight: 600; letter-spacing: .005em;
}
.ad-h2:first-child { margin-top: 0; }
.ad-h2 em { font-style: normal; font-size: 12px; font-weight: 400; color: var(--text-dim); }
.ad-footnote {
  margin: 26px 0 0; padding-top: 14px; border-top: 1px solid var(--border);
  font-size: 12px; color: var(--text-dim); font-variant-numeric: tabular-nums;
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
  padding: 14px 0; border-bottom: 1px solid var(--border);
  content-visibility: auto; contain-intrinsic-size: auto 92px;
}
.ad-list.compact .ad-row { padding: 11px 0; }
.ad-row:last-child { border-bottom: none; }
.ad-rank { font-size: 12px; color: var(--text-dim); font-variant-numeric: tabular-nums; padding-top: 2px; }
.ad-body { min-width: 0; }
.ad-line { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.ad-name {
  font-size: 14px; font-weight: 500; color: var(--text); text-decoration: none;
  overflow-wrap: anywhere;
}
.ad-name:hover { text-decoration: underline; }
.ad-name:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
.ad-lang {
  font-size: 11px; color: var(--text-dim); border: 1px solid var(--border);
  border-radius: 4px; padding: 1px 6px;
}
.ad-stats {
  margin-left: auto; display: flex; align-items: baseline; gap: 10px;
  font-size: 12px; color: var(--text-dim); font-variant-numeric: tabular-nums; white-space: nowrap;
}
.ad-stars { color: var(--text); }
.ad-gain { color: var(--text); }
.ad-new { border: 1px solid var(--border); border-radius: 4px; padding: 1px 6px; }
.ad-momentum { color: var(--accent); font-weight: 600; }
.ad-summary { margin: 6px 0 0; font-size: 13px; line-height: 1.65; color: var(--text-dim); }
.ad-topics { margin: 6px 0 0; font-size: 12px; color: var(--text-dim); }

/* 条状分布 */
.ad-bars { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.ad-bar-row {
  display: grid; grid-template-columns: minmax(120px, 1.1fr) 1fr auto; align-items: center; gap: 12px;
  font-size: 13px;
}
.ad-bar-row.single { grid-template-columns: minmax(120px, 1.1fr) auto; }
.ad-bar-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ad-bar-track { height: 4px; border-radius: 2px; background: var(--border); overflow: hidden; }
.ad-bar-fill { display: block; height: 100%; border-radius: 2px; background: var(--text-dim); }
.ad-bar-value { font-size: 12px; color: var(--text-dim); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* 标签 */
.ad-pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
.ad-pill {
  font-size: 12px; padding: 3px 9px; color: var(--text-dim);
  border: 1px solid var(--border); border-radius: 999px;
}
.ad-pill em { font-style: normal; margin-left: 5px; color: var(--text); font-variant-numeric: tabular-nums; }

/* 状态 */
.ad-state { padding: 40px 0; border-top: 1px solid var(--border); }
.ad-state-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; }
.ad-state-body { margin: 0; font-size: 13px; line-height: 1.7; color: var(--text-dim); }
.ad-retry {
  margin-top: 14px; font: inherit; font-size: 13px; padding: 6px 14px; cursor: pointer;
  border: 1px solid var(--border); border-radius: 6px; background: transparent; color: var(--text);
}
.ad-retry:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* 骨架 */
.ad-skeleton { display: flex; flex-direction: column; gap: 18px; padding: 20px 0; }
.ad-skel-row { display: grid; grid-template-columns: 34px 1fr; gap: 10px; }
.ad-skel-rank { width: 14px; height: 10px; background: var(--border); border-radius: 2px; }
.ad-skel-body { display: flex; flex-direction: column; gap: 8px; }
.ad-skel-line { display: block; height: 10px; border-radius: 2px; background: var(--border); }
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
