<template>
  <div class="co-show">
    <figure class="co-show-shot">
      <figcaption class="co-show-cap">
        <span class="co-show-cap-l">
          <b>交付物 01 · 乐清市充电桩分布图</b>
          <i>2026.08 · 25 个乡镇街道 · 10 万+ 条数据</i>
        </span>
        <router-link class="co-show-link" to="/work/charging-map">看这个项目怎么做的 →</router-link>
      </figcaption>

      <div class="co-mock">
        <div class="co-mock-bar">
          <span class="co-mock-title">充电桩检定监管平台</span>
          <button
            v-for="t in towns"
            :key="t"
            class="co-chip"
            :class="{ 'is-on': activeTown === t }"
            :aria-pressed="activeTown === t"
            type="button"
            @click="pickTown(t)"
          >{{ t }}</button>
          <span class="co-chip is-ghost" aria-hidden="true">+ 22 个乡镇</span>
          <label class="co-mock-search">
            <svg class="co-mock-search-k" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            <input
              v-model="q"
              type="search"
              placeholder="搜索桩号 / 地址"
              aria-label="搜索桩号或地址"
            />
          </label>
        </div>

        <div class="co-mock-body">
          <div class="co-mock-map" role="group" aria-label="乐清市充电桩分布示意图">
            <svg viewBox="0 0 640 360" preserveAspectRatio="none" aria-hidden="true">
              <g fill="currentColor" fill-opacity="0.065" stroke="none">
                <path d="M0 30 L206 22 L214 148 L120 176 L0 158 Z" />
                <path d="M214 22 L470 34 L462 166 L300 182 L214 148 Z" />
                <path d="M470 34 L640 28 L640 172 L462 166 Z" />
                <path d="M0 158 L120 176 L128 312 L0 330 Z" />
                <path d="M120 176 L300 182 L292 322 L128 312 Z" />
                <path d="M300 182 L462 166 L470 318 L292 322 Z" />
                <path d="M462 166 L640 172 L640 336 L470 318 Z" />
              </g>
              <g fill="none" stroke="currentColor" stroke-linecap="square">
                <path d="M-10 236 L148 224 L322 250 L498 232 L650 254" stroke-opacity="0.3" stroke-width="2.6" />
                <path d="M136 -10 L152 132 L128 262 L166 370" stroke-opacity="0.3" stroke-width="2.6" />
                <path d="M-10 116 L196 104 L420 128 L650 110" stroke-opacity="0.17" stroke-width="1.4" />
                <path d="M432 -10 L416 154 L452 274 L432 370" stroke-opacity="0.17" stroke-width="1.4" />
                <path d="M286 -10 L298 118 L276 258 L306 370" stroke-opacity="0.12" stroke-width="1.2" />
              </g>
              <g stroke="currentColor" stroke-opacity="0.055" stroke-width="1">
                <path d="M0 45h640M0 90h640M0 135h640M0 180h640M0 225h640M0 270h640M0 315h640" />
                <path d="M45 0v360M90 0v360M135 0v360M180 0v360M225 0v360M270 0v360M315 0v360M360 0v360M405 0v360M450 0v360M495 0v360M540 0v360M585 0v360" />
              </g>
            </svg>

            <button
              v-for="s in stations"
              :key="s.id"
              class="co-pin"
              :class="{
                'is-pass': s.status === 'pass',
                'is-fail': s.status === 'fail',
                'is-wait': s.status === 'wait',
                'is-hot': selected && selected.id === s.id,
                'is-dim': activeTown !== '全部' && s.town !== activeTown,
              }"
              :style="{ left: s.x + '%', top: s.y + '%' }"
              :aria-label="`${s.name}，${statusText(s.status)}`"
              type="button"
              @click="select(s)"
            ></button>

            <span class="co-sel" :style="selStyle" aria-hidden="true"></span>

            <div class="co-pin-card" v-if="selected" :style="cardStyle">
              <h5>{{ selected.town }} · {{ selected.name }}<span>{{ selected.id }} · {{ selected.guns }} 枪</span></h5>
              <dl>
                <div><dt>充电功率</dt><dd>{{ selected.kw }} kW</dd></div>
                <div><dt>最近检定</dt><dd>{{ selected.checked }}</dd></div>
                <div><dt>下次到期</dt><dd>{{ selected.next }}</dd></div>
              </dl>
              <span class="co-pin-st" :class="`is-${selected.status}`">{{ statusText(selected.status) }}</span>
            </div>

            <span class="co-map-tag">{{ activeTown === '全部' ? '全部乡镇' : activeTown + '选区' }} · {{ stations.length }} 台</span>
          </div>

          <div class="co-mock-list">
            <div class="co-mock-list-h">
              <span>检定记录</span>
              <span>样本 {{ shown.length }} / 10,482 条</span>
            </div>
            <button
              v-for="s in shown"
              :key="s.id"
              class="co-mock-row"
              :class="{ 'is-on': selected && selected.id === s.id }"
              type="button"
              @click="select(s)"
            >
              <span class="co-mock-id">{{ s.id }}</span>
              <span class="co-mock-nm">{{ s.name }}<i>{{ s.addr }} · {{ s.guns }} 枪</i></span>
              <span class="co-tagx" :class="`is-${s.status}`">{{ statusText(s.status) }}</span>
            </button>
            <p v-if="!shown.length" class="co-mock-empty">没有匹配的记录，换个乡镇或清空搜索。</p>
            <div class="co-mock-more">
              <span v-if="shown.length">按乡镇分组 · {{ townCount }} 组</span>
              <span v-else>筛选中</span>
              <span class="co-mock-readonly">只读视图 · 不提供导出</span>
            </div>
          </div>
        </div>

        <div class="co-mock-foot">
          <span>筛选响应 <b>{{ lastMs }} ms</b></span>
          <span>空间索引 PostGIS</span>
          <span>数据更新 2026-08-14 03:00</span>
          <span class="co-mock-note">按交付版本重绘 · 可筛选查看</span>
        </div>
      </div>
    </figure>

    <ol class="co-show-idx">
      <li v-for="(c, i) in cases" :key="c.slug">
        <router-link :to="`/work/${c.slug}`" class="co-idx-row">
          <span class="co-idx-n">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="co-idx-main">
            <span class="co-idx-name">{{ c.name }}</span>
            <span class="co-idx-res">{{ c.result }}</span>
          </span>
          <span class="co-idx-st">{{ c.status }}</span>
        </router-link>
      </li>
      <li>
        <router-link class="co-idx-row co-idx-all" to="/work">
          <span class="co-idx-n">ALL</span>
          <span class="co-idx-main">
            <span class="co-idx-name">全部 {{ count }} 个项目</span>
            <span class="co-idx-res">按类型筛选，每条写了问题与结果</span>
          </span>
          <span class="co-idx-st">→</span>
        </router-link>
      </li>
    </ol>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineProps({
  cases: { type: Array, default: () => [] },
  count: { type: Number, default: 0 },
})

// 真数据是 25 个乡镇、10 万+ 条；这里是可操作的一小份样本，
// 结构、字段、交互与交付版本一致，行数不假装。
const STATIONS = [
  { id: '0417', town: '柳市镇', name: '车站路充电站', addr: '车站路 88 号', guns: 6, kw: 120, checked: '2026-08-02', next: '2027-08-01', status: 'pass', x: 33, y: 34 },
  { id: '0423', town: '柳市镇', name: '新光工业区站', addr: '新光路 21 号', guns: 8, kw: 180, checked: '2026-06-18', next: '2027-06-17', status: 'fail', x: 21, y: 52 },
  { id: '0438', town: '柳市镇', name: '柳青路快充点', addr: '柳青路 6 号', guns: 4, kw: 90, checked: '2026-08-11', next: '2027-08-10', status: 'pass', x: 42, y: 21 },
  { id: '0392', town: '北白象镇', name: '白象大道站', addr: '白象大道 12 号', guns: 4, kw: 60, checked: '2025-11-20', next: '2026-11-19', status: 'wait', x: 62, y: 30 },
  { id: '0401', town: '北白象镇', name: '磐石工业园点', addr: '磐石路 9 号', guns: 6, kw: 120, checked: '2026-07-05', next: '2027-07-04', status: 'pass', x: 74, y: 44 },
  { id: '0365', town: '虹桥镇', name: '溪西充电点', addr: '溪西路 3 号', guns: 2, kw: 40, checked: '2026-05-28', next: '2027-05-27', status: 'pass', x: 47, y: 62 },
  { id: '0377', town: '虹桥镇', name: '虹桥客运中心站', addr: '振兴路 40 号', guns: 10, kw: 240, checked: '2026-08-09', next: '2027-08-08', status: 'pass', x: 58, y: 76 },
  { id: '0309', town: '雁荡镇', name: '旅游集散中心点', addr: '集散中心 B 区', guns: 10, kw: 240, checked: '2025-12-30', next: '2026-12-29', status: 'wait', x: 82, y: 63 },
]

const towns = ['全部', '柳市镇', '北白象镇', '虹桥镇', '雁荡镇']
const activeTown = ref('全部')
const q = ref('')
const selectedId = ref('0417')
const lastMs = ref(12)

const stations = computed(() =>
  STATIONS.filter((s) => activeTown.value === '全部' || s.town === activeTown.value)
)

const shown = computed(() => {
  const kw = q.value.trim().toLowerCase()
  if (!kw) return stations.value
  return stations.value.filter(
    (s) =>
      s.id.includes(kw) ||
      s.name.includes(kw) ||
      s.addr.includes(kw) ||
      s.town.includes(kw)
  )
})

const selected = computed(
  () => shown.value.find((s) => s.id === selectedId.value) || shown.value[0] || null
)

const townCount = computed(() => new Set(stations.value.map((s) => s.town)).size)

// 选区框跟着选中的桩走，点哪个框在哪
const selStyle = computed(() => {
  const s = selected.value
  if (!s) return { display: 'none' }
  const w = 20
  const h = 26
  const left = Math.min(Math.max(s.x - w / 2, 1), 99 - w)
  const top = Math.min(Math.max(s.y - h / 2, 2), 98 - h)
  return { left: left + '%', top: top + '%', width: w + '%', height: h + '%' }
})

const statusText = (s) => ({ pass: '合格', wait: '待检', fail: '不合格' })[s]

// 卡片不压住选中的桩：桩在左半张就往右放，反之往左放
const cardStyle = computed(() => {
  const s = selected.value
  if (!s) return {}
  const y = Math.min(Math.max(s.y - 26, 6), 96 - 58)
  return s.x > 50
    ? { left: '8px', right: 'auto', top: y + '%' }
    : { left: 'auto', right: '8px', top: y + '%' }
})

// 筛选是本地计算，报真实耗时（而不是写死 12ms）
function measure(fn) {
  const t0 = performance.now()
  fn()
  lastMs.value = Math.max(1, Math.round(performance.now() - t0))
}

function pickTown(t) {
  measure(() => {
    activeTown.value = t
    const first = STATIONS.find((s) => t === '全部' || s.town === t)
    if (first) selectedId.value = first.id
  })
}

function select(s) {
  selectedId.value = s.id
}

</script>
