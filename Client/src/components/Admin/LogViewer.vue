<template>
  <div class="log-viewer">
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <!-- 日志来源切换 -->
      <div class="source-tabs">
        <button class="source-tab" :class="{ active: logSource === 'backend' }" @click="switchSource('backend')">
          后端日志
        </button>
        <button class="source-tab" :class="{ active: logSource === 'caddy' }" @click="switchSource('caddy')">
          Caddy 访问日志
        </button>
      </div>
      <span class="section-count">— 共 {{ total }} 行</span>
      <div class="head-actions">
        <template v-if="logSource === 'backend'">
          <button class="btn-sm btn-filter" :class="{ active: filterLevel === 'error' }" @click="toggleFilter('error')">
            <span class="filter-dot dot-red" :class="{ dim: filterLevel !== 'error' }"></span>
            错误
          </button>
          <button class="btn-sm btn-filter" :class="{ active: filterLevel === 'warn' }" @click="toggleFilter('warn')">
            <span class="filter-dot dot-yellow" :class="{ dim: filterLevel !== 'warn' }"></span>
            警告
          </button>
          <button class="btn-sm btn-filter" :class="{ active: filterLevel === 'info' }" @click="toggleFilter('info')">
            <span class="filter-dot dot-cyan" :class="{ dim: filterLevel !== 'info' }"></span>
            信息
          </button>
          <button class="btn-sm btn-filter" @click="clearLogs">
            <span class="filter-icon">🗑</span> 清空
          </button>
        </template>
        <label v-if="logSource === 'caddy'" class="toggle-admin">
          <input v-model="showAdmin" type="checkbox" @change="fetchLogs" />
          <span>显示管理员日志</span>
        </label>
        <button class="btn-sm btn-refresh" @click="fetchLogs">
          <span class="filter-icon">↻</span> 刷新
        </button>
      </div>
    </div>

    <!-- Caddy 日志：列头 -->
    <div v-if="logSource === 'caddy' && logs.length" class="caddy-cols">
      <span>时间</span>
      <span>IP</span>
      <span>方法</span>
      <span>路径</span>
      <span>状态</span>
      <span>耗时</span>
    </div>

    <!-- 加载 -->
    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span>正在加载日志...</span>
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
          <span class="state-text">暂无日志记录</span>
        </div>

        <!-- 后端日志：终端行 -->
        <div
          v-if="logSource === 'backend'"
          v-for="(line, i) in logs"
          :key="i"
          class="log-line"
          :class="'level-' + line.level"
        >
          <span class="log-ts">[{{ line.ts }}]</span>
          <span class="log-level" :class="'badge-' + line.level">{{ line.level.toUpperCase() }}</span>
          <span class="log-msg">{{ line.message }}</span>
        </div>

        <!-- Caddy 日志：IP/请求/状态 表格 -->
        <div
          v-if="logSource === 'caddy'"
          v-for="(line, i) in logs"
          :key="i"
          class="caddy-line"
          :class="'caddy-status-' + (line.status >= 500 ? 'err' : line.status >= 400 ? 'warn' : 'ok')"
        >
          <span class="caddy-ts">{{ line.ts }}</span>
          <span class="caddy-ip">{{ line.ip }}</span>
          <span class="caddy-method">{{ line.method }}</span>
          <span class="caddy-uri">{{ line.uri }}</span>
          <span class="caddy-status">{{ line.status }}</span>
          <span class="caddy-dur">{{ line.duration }}</span>
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
const limit = ref(500)
const filterLevel = ref('')
const loading = ref(true)
const error = ref('')
const logContainer = ref(null)
const logSource = ref('backend')  // 'backend' | 'caddy'
const showAdmin = ref(false)       // Caddy 日志是否显示管理员控制台操作

let autoRefreshTimer = null

function switchSource(src) {
  if (logSource.value === src) return
  logSource.value = src
  filterLevel.value = ''
  fetchLogs()
}

function toggleFilter(level) {
  filterLevel.value = filterLevel.value === level ? '' : level
  fetchLogs()
}

async function fetchLogs() {
  error.value = ''
  try {
    const params = new URLSearchParams({ limit: String(limit.value) })
    if (filterLevel.value) params.set('level', filterLevel.value)
    if (logSource.value === 'caddy' && showAdmin.value) params.set('include_admin', '1')

    const url = logSource.value === 'caddy'
      ? `${API_BASE}/admin/logs/caddy?${params}`
      : `${API_BASE}/admin/logs?${params}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || '获取失败')
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
  if (logSource.value === 'caddy') return  // Caddy 日志由 Caddy 持有，不能清空
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
.section-count { font-size: 11px; color: var(--text-muted); }

/* 日志来源切换 */
.source-tabs {
  display: flex; gap: 4px;
  background: var(--bg-code); border: 1px solid var(--border);
  border-radius: 6px; padding: 3px;
}
.source-tab {
  padding: 5px 14px; font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--text-muted); background: none; border: none; border-radius: 4px;
  cursor: pointer; transition: all 0.2s;
}
.source-tab:hover { color: var(--text); }
.source-tab.active {
  color: var(--accent); background: var(--accent-a8);
  box-shadow: 0 0 10px var(--accent-a15);
}

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

/* 显示管理员日志开关 */
.toggle-admin {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  cursor: pointer; padding: 4px 8px;
  border: 1px dashed var(--border); border-radius: 4px;
  transition: all 0.2s;
}
.toggle-admin:hover { color: var(--text); border-color: var(--text-muted); }
.toggle-admin input { accent-color: var(--accent); cursor: pointer; }

.filter-dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-red { background: var(--err); }
.dot-yellow { background: var(--warn); }
.dot-cyan { background: var(--accent); }
.dim { opacity: 0.3; }
.filter-icon { font-size: 12px; }

/* Caddy 日志列头 */
.caddy-cols {
  display: grid; grid-template-columns: 150px 130px 60px 1fr 60px 60px;
  gap: 10px; padding: 7px 16px;
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  color: var(--text-muted); text-transform: uppercase;
  background: var(--overlay-a10); border: 1px solid var(--border);
  border-bottom: none; border-radius: 8px 8px 0 0;
}

/* 终端日志区 */
.log-terminal {
  background: var(--bg-code); border: 1px solid var(--border); border-radius: 8px;
  max-height: calc(100vh - 280px); min-height: 400px;
  overflow-y: auto; padding: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px; line-height: 1.8;
}
.log-terminal:has(.caddy-line) { padding: 0; border-radius: 0 0 8px 8px; }

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

/* Caddy 日志行 */
.caddy-line {
  display: grid; grid-template-columns: 150px 130px 60px 1fr 60px 60px;
  gap: 10px; padding: 5px 16px; align-items: baseline;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px; line-height: 1.6;
  background: var(--bg-code); border-bottom: 1px solid var(--border-a30);
}
.caddy-line:last-child { border-radius: 0 0 8px 8px; border-bottom: none; }
.caddy-ts { color: var(--text-muted); font-size: 11px; }
.caddy-ip { color: var(--accent); font-weight: 600; }
.caddy-method { color: var(--text-secondary); }
.caddy-uri { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.caddy-status { font-weight: 700; text-align: center; }
.caddy-dur { color: var(--text-muted); font-size: 11px; }
.caddy-status-ok .caddy-status { color: var(--ok); }
.caddy-status-warn .caddy-status { color: var(--warn); }
.caddy-status-err .caddy-status { color: var(--err); }

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
