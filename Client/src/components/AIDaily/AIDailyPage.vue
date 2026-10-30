<template>
  <div class="ad-page">
    <SiteNav />

    <main class="ad-main">
      <!-- 页头 -->
      <header class="ad-head">
        <p class="ad-kicker">每日更新 · 数据来自 GitHub</p>
        <h1 class="ad-title">AI 项目榜</h1>
        <p class="ad-desc">
          每天从 GitHub 抓取 AI 相关项目，按 24 小时 Star 增量排榜；没有增量的日子按新上榜与总 Star 补位。
          中文介绍由本机模型生成。
        </p>
        <div class="ad-views" role="tablist" aria-label="榜单视图">
          <button
            type="button" role="tab" class="ad-view" :class="{ active: view === 'today' }"
            :aria-selected="view === 'today'" @click="switchView('today')"
          >今日榜</button>
          <button
            type="button" role="tab" class="ad-view" :class="{ active: view === 'week' }"
            :aria-selected="view === 'week'" @click="switchView('week')"
          >本周 Top</button>
          <button
            type="button" role="tab" class="ad-view" :class="{ active: view === 'analysis' }"
            :aria-selected="view === 'analysis'" @click="switchView('analysis')"
          >潜力与成熟</button>
        </div>

        <div v-if="view === 'today'" class="ad-meta">
          <label class="ad-date-label" for="ad-date">榜单日期</label>
          <select
            id="ad-date"
            class="ad-select"
            :value="activeDate"
            :disabled="dates.length === 0"
            @change="onDateChange"
          >
            <option v-if="dates.length === 0" value="">暂无数据</option>
            <option v-for="d in dates" :key="d.date" :value="d.date">
              {{ d.date }} · {{ d.count }} 个
            </option>
          </select>
          <span v-if="updatedAtText" class="ad-updated">更新于 {{ updatedAtText }}</span>
        </div>
      </header>

      <!-- 潜力 / 成熟分析 -->
      <section v-if="view === 'analysis'" class="ad-analysis">
        <p class="ad-analysis-note">
          判据：总 Star ≥ {{ criteria.matureStars ? formatNumber(criteria.matureStars) : '30,000' }} 且仓库至少 {{ criteria.matureAgeDays || 365 }} 天为<strong>成熟</strong>，按近 {{ analysis.days || 7 }} 天累计增星排；
          其余项目需在窗口内上榜 ≥ {{ criteria.emergingMinAppear || 2 }} 次才算<strong>潜力</strong>，按相对增速（累计增星 ÷ 当前星数）排。
        </p>

        <div v-if="analysisLoading" class="ad-state"><p class="ad-state-body">分析加载中…</p></div>
        <div v-else-if="analysisError" class="ad-state">
          <p class="ad-state-title">分析没有加载出来</p>
          <p class="ad-state-body">接口返回了错误，稍后再试。</p>
          <button class="ad-retry" type="button" @click="loadAnalysis()">重新加载</button>
        </div>
        <template v-else>
          <h2 class="ad-analysis-title">潜力项目<span class="ad-analysis-sub">相对增速优先</span></h2>
          <ol v-if="analysis.emerging.length" class="ad-list">
            <li v-for="(item, i) in analysis.emerging" :key="'e-' + item.repo" class="ad-row">
              <span class="ad-rank" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="ad-body">
                <div class="ad-line">
                  <a class="ad-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
                  <span v-if="item.language" class="ad-lang">{{ item.language }}</span>
                  <span class="ad-stats">
                    <span class="ad-momentum">+{{ item.momentumPct }}%</span>
                    <span class="ad-stars">★ {{ formatNumber(item.stars) }}</span>
                    <span class="ad-gain">+{{ formatNumber(item.gain) }}</span>
                  </span>
                </div>
                <p class="ad-summary">{{ item.desc || '这个项目还没有描述。' }}</p>
                <p class="ad-topics">
                  近 {{ analysis.days || 7 }} 天上榜 {{ item.appearances }} 次
                  <template v-if="item.ageDays !== null && item.ageDays !== undefined"> · 仓库 {{ item.ageDays }} 天</template>
                  <template v-if="item.ageDays === null"> · 年龄待采集</template>
                  <template v-if="item.active"> · 仍在活跃</template>
                </p>
              </div>
            </li>
          </ol>
          <p v-else class="ad-state-body">窗口内还没有满足条件的潜力项目，再跑几天数据会更准。</p>

          <h2 class="ad-analysis-title">成熟项目<span class="ad-analysis-sub">累计增星优先</span></h2>
          <ol v-if="analysis.mature.length" class="ad-list">
            <li v-for="(item, i) in analysis.mature" :key="'m-' + item.repo" class="ad-row">
              <span class="ad-rank" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="ad-body">
                <div class="ad-line">
                  <a class="ad-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
                  <span v-if="item.language" class="ad-lang">{{ item.language }}</span>
                  <span class="ad-stats">
                    <span class="ad-stars">★ {{ formatNumber(item.stars) }}</span>
                    <span class="ad-gain">+{{ formatNumber(item.gain) }}</span>
                  </span>
                </div>
                <p class="ad-summary">{{ item.desc || '这个项目还没有描述。' }}</p>
                <p class="ad-topics">
                  近 {{ analysis.days || 7 }} 天上榜 {{ item.appearances }} 次
                  <template v-if="item.ageDays !== null && item.ageDays !== undefined"> · 仓库 {{ item.ageDays }} 天</template>
                  <template v-if="item.active"> · 仍在活跃</template>
                </p>
              </div>
            </li>
          </ol>
          <p v-else class="ad-state-body">成熟项目需要积累几天的增量数据。</p>
        </template>
      </section>

      <template v-else>
      <!-- 加载骨架 -->
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

      <!-- 错误 / 空状态 -->
      <div v-else-if="error" class="ad-state">
        <p class="ad-state-title">榜单没有加载出来</p>
        <p class="ad-state-body">接口返回了错误，稍后刷新页面重试；如果一直失败，说明当天的采集任务可能没跑成功。</p>
        <button class="ad-retry" type="button" @click="load(activeDate)">重新加载</button>
      </div>

      <div v-else-if="items.length === 0" class="ad-state">
        <p class="ad-state-title">这一天还没有榜单</p>
        <p class="ad-state-body">采集任务每天上午运行一次，运行完成后这里会出现当天的 12 个项目。</p>
      </div>

      <!-- 本周聚合 -->
      <div v-else-if="view === 'week'" class="ad-weekly">
        <p class="ad-weekly-meta">
          <template v-if="week.snapshots">
            {{ week.from }} → {{ week.to }}，共 {{ week.snapshots }} 次快照 · 按本周累计 Star 增量排
          </template>
          <template v-else>本周还没有快照，榜单跑几天之后这里会有数据。</template>
        </p>
        <ol v-if="week.items.length" class="ad-list">
          <li v-for="item in week.items" :key="item.repo" class="ad-row">
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
              <p class="ad-topics">
                本周上榜 {{ item.hits }} 次 · 首次 {{ item.firstSeen }}
                <template v-if="item.topics"> · {{ item.topics.split(',').slice(0, 3).join(' · ') }}</template>
              </p>
            </div>
          </li>
        </ol>
        <p v-else class="ad-state-body">还没有可以聚合的榜单数据。</p>
      </div>

      <!-- 榜单 -->
      <ol v-else class="ad-list">
        <li v-for="item in items" :key="item.repo" class="ad-row">
          <span class="ad-rank" aria-hidden="true">{{ String(item.rank).padStart(2, '0') }}</span>

          <div class="ad-body">
            <div class="ad-line">
              <a
                class="ad-name"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
              >{{ item.repo }}</a>
              <span v-if="item.language" class="ad-lang">{{ item.language }}</span>
              <span class="ad-stats">
                <span class="ad-stars" :title="`总 Star ${formatNumber(item.stars)}`">
                  ★ {{ formatNumber(item.stars) }}
                </span>
                <span v-if="item.star_gain > 0" class="ad-gain">+{{ formatNumber(item.star_gain) }}</span>
                <span v-else-if="item.first_seen === activeDate" class="ad-new">新上榜</span>
              </span>
            </div>

            <p class="ad-summary">{{ item.desc_zh || item.desc_en || '这个项目还没有描述。' }}</p>

            <p v-if="item.topics" class="ad-topics">{{ item.topics.split(',').slice(0, 4).join(' · ') }}</p>
          </div>
        </li>
      </ol>
      </template>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'

const items = ref([])
const dates = ref([])
const activeDate = ref('')
const updatedAt = ref(null)
const loading = ref(true)
const error = ref(false)
const view = ref('today')
const week = ref({ days: 7, snapshots: 0, from: null, to: null, items: [] })
const analysis = ref({ days: 7, mature: [], emerging: [], criteria: {} })
const criteria = computed(() => analysis.value.criteria || {})
const analysisLoading = ref(false)
const analysisError = ref(false)
let analysisLoaded = false

const updatedAtText = computed(() => {
  if (!updatedAt.value) return ''
  const d = new Date(updatedAt.value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US')
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

async function loadWeekly() {
  try {
    const res = await fetch('/api/ai-daily/weekly?days=7&limit=8')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    week.value = await res.json()
  } catch (err) {
    console.error('本周聚合加载失败:', err)
  }
}

async function loadAnalysis(force = false) {
  if (analysisLoaded && !force) return
  analysisLoading.value = true
  analysisError.value = false
  try {
    const res = await fetch('/api/ai-daily/analysis?days=7')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    analysis.value = {
      days: data.days || 7,
      criteria: data.criteria || {},
      mature: data.mature || [],
      emerging: data.emerging || [],
    }
    analysisLoaded = true
  } catch (err) {
    console.error('加载潜力/成熟分析失败:', err)
    analysisError.value = true
  } finally {
    analysisLoading.value = false
  }
}

async function switchView(next) {
  view.value = next
  if (next === 'week') await loadWeekly()
  if (next === 'analysis') await loadAnalysis()
}

onMounted(async () => {
  await Promise.all([load(), loadDates()])
})
</script>

<style scoped>
.ad-page { min-height: 100vh; background: var(--bg); color: var(--text); }

/* 潜力 / 成熟分析 */
.ad-analysis { padding-top: 28px; }
.ad-analysis-note {
  margin: 0 0 24px; font-size: 13px; line-height: 1.75; color: var(--text-dim);
  border-left: 2px solid var(--border); padding-left: 14px;
}
.ad-analysis-note strong { color: var(--text); font-weight: 600; }
.ad-analysis-title {
  margin: 32px 0 16px; font-size: 16px; font-weight: 600; letter-spacing: .01em;
  display: flex; align-items: baseline; gap: 10px;
}
.ad-analysis-sub { font-size: 12px; font-weight: 400; color: var(--text-dim); letter-spacing: .04em; }
.ad-momentum {
  font-variant-numeric: tabular-nums; font-weight: 600;
  color: var(--accent, #2563eb);
}
.ad-main { max-width: 1200px; margin: 0 auto; padding: 72px 24px 112px; }

/* 页头 */
.ad-head { padding-bottom: 28px; border-bottom: 1px solid var(--border); }
.ad-kicker {
  margin: 0 0 10px; font-size: 12px; letter-spacing: .08em;
  color: var(--text-dim);
}
.ad-title {
  margin: 0; font-size: clamp(34px, 4.2vw, 52px); font-weight: 700;
  letter-spacing: -0.025em; line-height: 1.05; color: var(--text-bright);
  text-wrap: balance;
}
.ad-desc {
  margin: 14px 0 0; max-width: 62ch; font-size: 14px; line-height: 1.7;
  color: var(--text-dim); text-wrap: pretty;
}
.ad-meta { display: flex; align-items: center; gap: 12px; margin-top: 22px; flex-wrap: wrap; }
.ad-date-label { font-size: 12px; color: var(--text-dim); }
.ad-select {
  appearance: none; padding: 7px 30px 7px 11px; border-radius: 8px;
  border: 1px solid var(--border-strong); background: var(--bg-elevated);
  color: var(--text); font-size: 13px; font-variant-numeric: tabular-nums;
  background-image: linear-gradient(45deg, transparent 50%, var(--text-dim) 50%),
                    linear-gradient(135deg, var(--text-dim) 50%, transparent 50%);
  background-position: calc(100% - 16px) 50%, calc(100% - 11px) 50%;
  background-size: 5px 5px, 5px 5px; background-repeat: no-repeat;
  cursor: pointer;
}
.ad-select:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-updated { font-size: 12px; color: var(--text-faint); font-variant-numeric: tabular-nums; }

/* 榜单 */
.ad-list { list-style: none; margin: 0; padding: 0; }
.ad-row {
  display: grid; grid-template-columns: 52px 1fr; gap: 0 20px;
  padding: 22px 4px; border-bottom: 1px solid var(--border);
  transition: background-color .18s ease;
}
.ad-row:hover { background: color-mix(in srgb, var(--text) 2.5%, transparent); }
.ad-row:focus-within { background: color-mix(in srgb, var(--text) 3%, transparent); }
.ad-rank {
  font-size: 20px; font-weight: 650; color: var(--text-faint);
  font-variant-numeric: tabular-nums; line-height: 1.5;
}
.ad-body { min-width: 0; }
.ad-line { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.ad-name {
  font-size: 16px; font-weight: 650; letter-spacing: -0.01em;
  color: var(--text-bright); text-decoration: none;
  word-break: break-word;
}
.ad-name:hover { color: var(--accent); }
.ad-name:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px; }
.ad-lang {
  font-size: 11px; color: var(--text-dim); padding: 1px 7px;
  border: 1px solid var(--border); border-radius: 999px;
}
.ad-stats {
  margin-left: auto; display: inline-flex; align-items: baseline; gap: 10px;
  font-size: 12.5px; font-variant-numeric: tabular-nums; white-space: nowrap;
}
.ad-stars { color: var(--text-dim); }
.ad-gain { color: var(--accent); font-weight: 600; }
.ad-new { color: var(--text-dim); font-size: 11px; border-bottom: 1px solid var(--border-strong); }

.ad-summary {
  margin: 7px 0 0; font-size: 13.5px; line-height: 1.65;
  color: var(--text-secondary); max-width: 70ch; text-wrap: pretty;
}
.ad-topics {
  margin: 7px 0 0; font-size: 11px; color: var(--text-faint);
  letter-spacing: .02em; word-break: break-word;
}

/* 状态 */
.ad-state { padding: 56px 4px; border-top: 1px solid var(--border); }
.ad-state-title { margin: 0 0 8px; font-size: 16px; color: var(--text-bright); font-weight: 650; }
.ad-state-body { margin: 0; font-size: 13.5px; line-height: 1.7; color: var(--text-dim); max-width: 60ch; }
.ad-retry {
  margin-top: 18px; padding: 8px 16px; border-radius: 8px; cursor: pointer;
  border: 1px solid var(--border-strong); background: var(--bg-elevated);
  color: var(--text); font-size: 13px;
}
.ad-retry:hover { border-color: var(--accent); color: var(--accent); }
.ad-retry:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* 骨架 */
.ad-skeleton { border-top: 1px solid var(--border); }
.ad-skel-row { display: grid; grid-template-columns: 52px 1fr; gap: 20px; padding: 22px 4px; border-bottom: 1px solid var(--border); }
.ad-skel-rank { height: 20px; width: 28px; border-radius: 4px; background: var(--bg-elevated); }
.ad-skel-body { display: grid; gap: 10px; }
.ad-skel-line { height: 12px; border-radius: 4px; background: var(--bg-elevated); }
.ad-skel-line.w40 { width: 40%; }
.ad-skel-line.w80 { width: 80%; }
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

@media (max-width: 720px) {
  .ad-main { padding: 48px 20px 80px; }
  .ad-row { grid-template-columns: 34px 1fr; gap: 0 12px; padding: 18px 2px; }
  .ad-rank { font-size: 16px; }
  .ad-stats { margin-left: 0; width: 100%; }
  .ad-summary { font-size: 13px; }
}

@media (prefers-reduced-motion: reduce) {
  .ad-row { transition: none; }
}

/* 视图切换 */
.ad-views { display: flex; gap: 6px; margin: 20px 0 12px; }
.ad-view {
  border: 1px solid var(--border-strong); background: transparent; color: var(--text-dim);
  font-size: 12.5px; padding: 6px 12px; border-radius: 999px; cursor: pointer;
}
.ad-view:hover { color: var(--text); border-color: var(--text-dim); }
.ad-view.active { color: var(--accent); border-color: var(--accent); }
.ad-view:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ad-weekly-meta {
  margin: 0 0 4px; font-size: 12.5px; color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}
</style>
