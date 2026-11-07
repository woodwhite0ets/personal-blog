<template>
  <div class="tools-manager">
    <div class="section-head">
      <h1 class="section-title">工具库</h1>
      <span class="section-count">— 共 {{ total }} 条</span>
    </div>

    <div class="filters">
      <div class="status-tabs">
        <button
          v-for="s in statusTabs"
          :key="s.value"
          class="tab"
          :class="{ active: status === s.value }"
          :aria-pressed="status === s.value"
          @click="setStatus(s.value)"
        >{{ s.label }}</button>
      </div>

      <div class="filter-right">
        <select v-model="category" class="select" aria-label="按分类筛选" @change="reload">
          <option value="">全部分类</option>
          <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.label }}</option>
        </select>
        <div class="search-wrap">
          <input
            v-model="q" name="q"
            type="text"
            class="search-input"
            placeholder="搜名称、仓库、简介、评价…"
            aria-label="搜索工具"
            @input="onSearchInput"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="state-box" role="status" aria-live="polite">正在加载…</div>
    <div v-else-if="error" class="state-box error" role="alert">{{ error }}</div>
    <div v-else-if="items.length === 0" class="state-box">没有符合条件的工具</div>

    <template v-else>
      <div class="table-wrap">
        <table class="tool-table">
          <thead>
            <tr>
              <th>工具</th>
              <th>分类</th>
              <th>状态</th>
              <th class="th-num">权重</th>
              <th>一句话</th>
              <th>实测评价</th>
              <th class="th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="it in items" :key="it.id" :class="{ 'row-featured': it.status === 'featured' }">
              <td class="cell-name">
                <span class="name">{{ it.name }}</span>
                <span class="repo">{{ it.repo || '手动收录' }}</span>
                <span class="stars">★ {{ it.stars.toLocaleString() }}</span>
              </td>

              <td>
                <select v-model="it.draft.category" class="select select-sm" :aria-label="`${it.name} 的分类`">
                  <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.label }}</option>
                </select>
              </td>

              <td>
                <div class="status-btns">
                  <button
                    v-for="s in statusTabs.slice(1)"
                    :key="s.value"
                    type="button"
                    class="status-btn"
                    :class="{ active: it.draft.status === s.value, [s.value]: true }"
                    :aria-pressed="it.draft.status === s.value"
                    @click="it.draft.status = s.value"
                  >{{ s.label }}</button>
                </div>
              </td>

              <td class="th-num">
                <input v-model.number="it.draft.weight" type="number" class="num-input" step="5" :aria-label="`${it.name} 的排序权重`" />
              </td>

              <td>
                <textarea v-model="it.draft.tagline_zh" class="text-input one-line" rows="2" :aria-label="`${it.name} 的一句话`" />
              </td>

              <td>
                <textarea v-model="it.draft.note_zh" class="text-input" rows="2" :aria-label="`${it.name} 的实测评价`" placeholder="只有你填了才在页面上显示" />
              </td>

              <td class="th-actions">
                <button type="button" class="save-btn" :disabled="it.saving" @click="save(it)">
                  {{ it.saving ? '保存中…' : '保存' }}
                </button>
                <a v-if="it.repo" class="repo-link" :href="`https://github.com/${it.repo}`" target="_blank" rel="noopener">仓库</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager">
        <button type="button" class="pager-btn" :disabled="page <= 1" @click="go(page - 1)">上一页</button>
        <span class="pager-info">{{ page }} / {{ maxPage }}</span>
        <button type="button" class="pager-btn" :disabled="page >= maxPage" @click="go(page + 1)">下一页</button>
      </div>
    </template>

    <p class="save-hint" role="status" aria-live="polite">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getToken } from '../../stores/auth.js'

const API_BASE = '/api'
const LIMIT = 15

const statusTabs = [
  { value: '', label: '全部' },
  { value: 'featured', label: '精选' },
  { value: 'candidate', label: '候选' },
  { value: 'hidden', label: '隐藏' },
]

const categories = ref([])
const items = ref([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const category = ref('')
const q = ref('')
const loading = ref(false)
const error = ref('')
const hint = ref('')

const maxPage = computed(() => Math.max(1, Math.ceil(total.value / LIMIT)))

const draftOf = (it) => ({
  category: it.category,
  status: it.status,
  weight: it.weight,
  tagline_zh: it.tagline_zh || '',
  note_zh: it.note_zh || '',
})

async function loadCategories() {
  try {
    const res = await fetch(`${API_BASE}/ai-tools?limit=1`)
    if (!res.ok) return
    const data = await res.json()
    categories.value = data.categories || []
  } catch {
    /* chips 是辅助，失败不阻塞主流程 */
  }
}

async function load() {
  loading.value = true
  error.value = ''
  const params = new URLSearchParams({ page: String(page.value), limit: String(LIMIT) })
  if (status.value) params.set('status', status.value)
  if (category.value) params.set('category', category.value)
  if (q.value.trim()) params.set('q', q.value.trim())

  try {
    const res = await fetch(`${API_BASE}/admin/tools?${params}`, { headers: { Authorization: `Bearer ${getToken()}` } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    total.value = data.total
    items.value = data.items.map((it) => ({ ...it, draft: draftOf(it), saving: false }))
  } catch (err) {
    error.value = '加载失败，刷新重试'
    console.error('工具库管理加载失败', err)
  } finally {
    loading.value = false
  }
}

async function save(it) {
  it.saving = true
  hint.value = ''
  try {
    const res = await fetch(`${API_BASE}/admin/tools/${it.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(it.draft),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
    Object.assign(it, data, { draft: draftOf(data) })
    hint.value = `${it.name} 已保存`
  } catch (err) {
    hint.value = `${it.name} 保存失败：${err.message}`
  } finally {
    it.saving = false
  }
}

function setStatus(v) {
  status.value = v
  page.value = 1
  load()
}

function go(p) {
  page.value = p
  load()
}

function reload() {
  page.value = 1
  load()
}

let debounce
function onSearchInput() {
  clearTimeout(debounce)
  debounce = setTimeout(reload, 300)
}

onMounted(() => {
  loadCategories()
  load()
})
</script>

<style scoped>
.tools-manager { animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border);
}
.section-title { font-family: var(--font-hand); font-size: 1.375rem; font-weight: 400; color: var(--text-bright); }
.section-count { font-size: 0.6875rem; color: var(--text-muted); margin-left: auto; }

.filters { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
.status-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
.tab {
  padding: 6px 14px; font-family: inherit; font-size: 0.6875rem; font-weight: 600; color: var(--text-dim);
  background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; cursor: pointer;
  transition: color .2s;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.filter-right { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.search-wrap { display: flex; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); }
.search-wrap:focus-within { border-bottom-color: var(--accent); }
.search-input { font-family: inherit; font-size: 0.75rem; color: var(--text); background: none; border: none; outline: none; min-width: 200px; caret-color: var(--accent); }

.select {
  font-family: inherit; font-size: 0.75rem; padding: 5px 8px; border-radius: 4px;
  border: 1px solid var(--border); background-color: var(--bg-elevated); color: var(--text);
}
.select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.select-sm { padding: 3px 6px; font-size: 0.6875rem; }

.state-box { padding: 40px 0; text-align: center; font-size: 0.8125rem; color: var(--text-dim); }
.state-box.error { color: var(--err); }

.table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }
.tool-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; min-width: 1080px; }
.tool-table th {
  text-align: left; font-weight: 600; font-size: 0.6875rem; color: var(--text-dim);
  padding: 10px 12px; border-bottom: 1px solid var(--border); white-space: nowrap;
}
.tool-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
.tool-table tr:last-child td { border-bottom: none; }
.row-featured { background: color-mix(in srgb, var(--accent) 6%, transparent); }

.cell-name { display: flex; flex-direction: column; gap: 2px; min-width: 150px; }
.cell-name .name { color: var(--text-bright); font-weight: 600; }
.cell-name .repo { color: var(--text-faint); font-size: 0.6875rem; word-break: break-all; }
.cell-name .stars { color: var(--text-muted); font-size: 0.6875rem; font-variant-numeric: tabular-nums; }

.status-btns { display: flex; gap: 3px; }
.status-btn {
  font-family: inherit; font-size: 0.6875rem; padding: 3px 8px; border-radius: 4px; cursor: pointer;
  border: 1px solid var(--border); background: none; color: var(--text-dim);
}
.status-btn:hover { color: var(--text); }
.status-btn.active.featured { border-color: var(--accent); color: var(--accent); }
.status-btn.active.candidate { border-color: var(--border-strong); color: var(--text); }
.status-btn.active.hidden { border-color: var(--err); color: var(--err); }
.status-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.th-num { width: 76px; }
.num-input {
  width: 66px; font-family: inherit; font-size: 0.75rem; padding: 4px 6px; border-radius: 4px;
  border: 1px solid var(--border); background-color: var(--bg-elevated); color: var(--text);
  font-variant-numeric: tabular-nums;
}
.num-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

.text-input {
  width: 100%; min-width: 180px; font-family: inherit; font-size: 0.75rem; line-height: 1.55;
  padding: 6px 8px; border-radius: 4px; border: 1px solid var(--border);
  background-color: var(--bg-elevated); color: var(--text); resize: vertical;
}
.text-input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.one-line { min-width: 200px; }

.th-actions { width: 110px; text-align: right; }
.save-btn {
  font-family: inherit; font-size: 0.6875rem; padding: 4px 10px; border-radius: 4px; cursor: pointer;
  border: 1px solid var(--border-strong); background: none; color: var(--text);
}
.save-btn:hover { border-color: var(--accent); color: var(--accent); }
.save-btn:disabled { opacity: .5; cursor: default; }
.save-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.repo-link { display: block; margin-top: 6px; font-size: 0.6875rem; color: var(--text-faint); text-decoration: none; }
.repo-link:hover { color: var(--accent); }

.pager { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 18px; font-size: 0.75rem; }
.pager-btn {
  font-family: inherit; font-size: 0.75rem; padding: 5px 12px; border-radius: 4px; cursor: pointer;
  border: 1px solid var(--border); background: none; color: var(--text-dim);
}
.pager-btn:hover:not(:disabled) { color: var(--text); border-color: var(--border-strong); }
.pager-btn:disabled { opacity: .4; cursor: default; }
.pager-info { color: var(--text-muted); font-variant-numeric: tabular-nums; }

.save-hint { margin: 14px 0 0; font-size: 0.75rem; color: var(--text-dim); min-height: 16px; }

@media (prefers-reduced-motion: reduce) {
  .tools-manager { animation: none; }
}
</style>
