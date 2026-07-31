<template>
  <div class="log-viewer">
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <span class="section-title">journalctl -f -n {{ limit }}</span>
      <span class="section-count">— {{ total }} lines</span>
      <div class="head-actions">
        <button class="btn-sm btn-filter" :class="{ active: filterLevel === 'error' }" @click="toggleFilter('error')">
          <span class="filter-dot dot-red" :class="{ dim: filterLevel !== 'error' }"></span>
          errors
        </button>
        <button class="btn-sm btn-filter" :class="{ active: filterLevel === 'warn' }" @click="toggleFilter('warn')">
          <span class="filter-dot dot-yellow" :class="{ dim: filterLevel !== 'warn' }"></span>
          warns
        </button>
        <button class="btn-sm btn-filter" :class="{ active: filterLevel === 'info' }" @click="toggleFilter('info')">
          <span class="filter-dot dot-cyan" :class="{ dim: filterLevel !== 'info' }"></span>
          info
        </button>
        <button class="btn-sm btn-filter" @click="clearLogs">
          <span class="filter-icon">🗑</span> clear
        </button>
        <button class="btn-sm btn-refresh" @click="fetchLogs">
          <span class="filter-icon">↻</span> refresh
        </button>
      </div>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span>loading logs...</span>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="state-box error">
      <span class="err-prefix">ERR!</span>
      <span>{{ error }}</span>
    </div>

    <!-- 日志终端 -->
    <template v-else>
      <div class="log-terminal" ref="logContainer">
        <div v-if="logs.length === 0" class="state-box">
          <span class="state-text">no logs captured yet</span>
        </div>
        <div
          v-for="(line, i) in logs"
          :key="i"
          class="log-line"
          :class="'level-' + line.level"
        >
          <span class="log-ts">[{{ line.ts }}]</span>
          <span class="log-level" :class="'badge-' + line.level">{{ line.level.toUpperCase() }}</span>
          <span class="log-msg">{{ line.message }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { getToken } from '../../stores/auth.js'

const API_BASE = '/api'

const logs = ref([])
const total = ref(0)
const limit = ref(100)
const filterLevel = ref('')
const loading = ref(true)
const error = ref('')
const logContainer = ref(null)

let autoRefreshTimer = null

function toggleFilter(level) {
  filterLevel.value = filterLevel.value === level ? '' : level
  fetchLogs()
}

async function fetchLogs() {
  error.value = ''
  try {
    const params = new URLSearchParams({ limit: String(limit.value) })
    if (filterLevel.value) params.set('level', filterLevel.value)

    const res = await fetch(`${API_BASE}/admin/logs?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || 'fetch failed')
    const data = await res.json()
    logs.value = data.logs
    total.value = data.total

    // 自动滚到底部
    await nextTick()
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function clearLogs() {
  try {
    await fetch(`${API_BASE}/admin/logs`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    logs.value = []
    total.value = 0
  } catch (e) {
    error.value = e.message
  }
}

// 每 5 秒自动刷新
onMounted(() => {
  fetchLogs()
  autoRefreshTimer = setInterval(() => fetchLogs(), 5000)
})

// 页面卸载时清除定时器
onUnmounted(() => {
  clearInterval(autoRefreshTimer)
})
</script>

<style scoped>
.log-viewer { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.section-arrow { color: var(--accent); font-weight: 700; }
.section-title { font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: 0.5px; }
.section-count { font-size: 11px; color: var(--text-muted); }

.head-actions { display: flex; gap: 6px; margin-left: auto; }

.btn-sm {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; font-family: inherit; font-size: 11px; font-weight: 600;
  border-radius: 4px; cursor: pointer;
  transition: all 0.2s; border: 1px solid var(--border);
  background: none; color: var(--text-dim);
}
.btn-sm:hover { border-color: var(--text-muted); color: var(--text); }
.btn-sm.active { border-color: var(--accent); color: var(--accent); background: var(--accent-a6); }

.btn-filter { gap: 6px; min-width: 70px; }

.filter-dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-red { background: var(--err); }
.dot-yellow { background: var(--warn); }
.dot-cyan { background: var(--accent); }
.dim { opacity: 0.3; }
.filter-icon { font-size: 12px; }

/* 终端日志区 */
.log-terminal {
  background: var(--bg-code); border: 1px solid var(--border); border-radius: 8px;
  max-height: calc(100vh - 280px); min-height: 400px;
  overflow-y: auto; padding: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px; line-height: 1.8;
}

.log-line {
  display: flex; gap: 10px; align-items: baseline;
  padding: 2px 0; border-bottom: 1px solid var(--border-a30);
  white-space: nowrap;
}
.log-line:last-child { border-bottom: none; }

.log-ts {
  color: var(--text-muted); font-size: 11px; flex-shrink: 0;
  min-width: 148px;
}

.log-level {
  font-size: 9px; font-weight: 700; letter-spacing: 1px;
  padding: 1px 6px; border-radius: 3px; flex-shrink: 0;
  min-width: 48px; text-align: center;
}
.badge-info  { color: var(--accent); background: var(--accent-a8); border: 1px solid var(--accent-a20); }
.badge-warn  { color: var(--warn); background: var(--warn-a8); border: 1px solid var(--warn-a20); }
.badge-error { color: var(--err); background: var(--err-a8); border: 1px solid var(--err-a20); }

.log-msg {
  color: var(--text-secondary); overflow: hidden;
  text-overflow: ellipsis;
}

.level-error .log-msg { color: var(--err); }
.level-warn  .log-msg { color: var(--warn); }

/* 状态 */
.state-box {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 20px; font-size: 13px; color: var(--text-muted);
}
.state-box.error { color: var(--err); flex-direction: column; gap: 8px; }
.err-prefix { font-weight: 700; letter-spacing: 1px; }
.state-text { color: inherit; }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
