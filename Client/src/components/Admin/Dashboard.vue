<template>
  <div class="dashboard">
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <span class="section-title">cat /proc/dashboard</span>
    </div>

    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span class="state-text">loading stats...</span>
    </div>

    <template v-else-if="stats">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot dot-green"></span>
            <span class="stat-label">users</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number">{{ stats.users || 0 }}</span>
            <span class="stat-sub">registered users</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot dot-cyan"></span>
            <span class="stat-label">posts</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number">{{ stats.posts.total }}</span>
            <span class="stat-sub">total posts</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot" style="background:#2bd64e"></span>
            <span class="stat-label">published</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number" style="color:#2bd64e">{{ stats.posts.published }}</span>
            <span class="stat-sub">live posts</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot dot-yellow"></span>
            <span class="stat-label">drafts</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number" style="color:#feba0a">{{ stats.posts.draft }}</span>
            <span class="stat-sub">unpublished drafts</span>
          </div>
        </div>
      </div>

      <!-- 最近数据 -->
      <div class="data-grid">
        <div class="data-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">tail -5 /var/log/users.log</span>
          </div>
          <div class="panel-body">
            <table class="data-table">
              <thead>
                <tr><th>username</th><th>role</th><th>joined</th></tr>
              </thead>
              <tbody>
                <tr v-for="u in stats.recent_users" :key="u.id">
                  <td>
                    <router-link :to="`/user/${u.username}`" class="user-link">@{{ u.username }}</router-link>
                  </td>
                  <td><span class="role-badge" :class="u.role">{{ u.role }}</span></td>
                  <td class="muted">{{ formatDate(u.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="data-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-green"></span>
            <span class="panel-dot dot-green dim"></span>
            <span class="panel-title">tail -5 /var/log/posts.log</span>
          </div>
          <div class="panel-body">
            <table class="data-table">
              <thead>
                <tr><th>title</th><th>status</th><th>author</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in stats.recent_posts" :key="p.slug">
                  <td>
                    <router-link :to="`/post/${p.slug}`" class="user-link">{{ p.title }}</router-link>
                  </td>
                  <td><span class="status-badge" :class="p.status">{{ p.status }}</span></td>
                  <td class="muted">@{{ p.username }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div v-else-if="error" class="state-box error">
      <span class="err-prefix">ERR!</span>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getToken } from '../../stores/auth.js'

const API_BASE = '/api'

const stats = ref(null)
const loading = ref(true)
const error = ref('')

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().split('T')[0]
}

async function fetchStats() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || 'fetch failed')
    stats.value = await res.json()
  } catch (e) {
    error.value = e.message || 'connection refused'
  } finally {
    loading.value = false
  }
}

onMounted(fetchStats)
</script>

<style scoped>
.dashboard { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 28px; padding-bottom: 12px;
  border-bottom: 1px solid #1c1d21;
}
.section-arrow { color: #00d4ff; font-weight: 700; }
.section-title { font-size: 13px; font-weight: 600; color: #c9d1d9; letter-spacing: 0.5px; }

.state-box {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 20px; font-size: 13px; color: #484b52;
}
.state-box.error { color: #ff5f57; flex-direction: column; gap: 8px; }
.err-prefix { font-weight: 700; letter-spacing: 1px; }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid #1c1d21; border-top-color: #00d4ff;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 卡片网格 */
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: #0f1013; border: 1px solid #1c1d21;
  border-radius: 8px; overflow: hidden;
  transition: border-color 0.2s;
}
.stat-card:hover { border-color: #25262a; }

.stat-card-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: rgba(255,255,255,0.015);
  border-bottom: 1px solid #1c1d21;
}
.stat-dot { width: 7px; height: 7px; border-radius: 50%; }
.dot-cyan { background: #00d4ff; }
.dot-green { background: #2bd64e; }
.dot-yellow { background: #feba0a; }
.stat-label {
  font-size: 10px; font-weight: 600; color: #484b52;
  letter-spacing: 1.5px; text-transform: lowercase;
}

.stat-card-body {
  padding: 16px; display: flex; flex-direction: column; gap: 4px;
}

.stat-number { font-size: 32px; font-weight: 800; color: #e6edf3; line-height: 1; }
.stat-sub { font-size: 11px; color: #484b52; }

/* 数据面板 */
.data-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}

.data-panel {
  background: #0f1013; border: 1px solid #1c1d21;
  border-radius: 8px; overflow: hidden;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: rgba(255,255,255,0.015);
  border-bottom: 1px solid #1c1d21;
}
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dim { opacity: 0.3; }
.panel-title {
  flex: 1; font-size: 10px; font-weight: 600;
  color: #484b52; text-align: center; letter-spacing: 1px;
}

.panel-body { padding: 0; }

/* 表格 */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  font-size: 10px; font-weight: 600; color: #484b52;
  text-transform: uppercase; letter-spacing: 1px;
  text-align: left; padding: 10px 14px;
  background: rgba(255,255,255,0.01);
  border-bottom: 1px solid #1c1d21;
}
.data-table td {
  padding: 9px 14px; font-size: 12px; color: #8b9098;
  border-bottom: 1px solid rgba(28,29,33,0.5);
}
.data-table tbody tr:hover { background: rgba(255,255,255,0.015); }
.data-table tbody tr:last-child td { border-bottom: none; }

.user-link { color: #00d4ff; text-decoration: none; transition: opacity 0.2s; }
.user-link:hover { opacity: 0.8; }

.role-badge, .status-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  padding: 2px 8px; border-radius: 3px; text-transform: uppercase;
}
.role-badge.admin { color: #00d4ff; background: rgba(0,212,255,0.08); border: 1px solid rgba(0,212,255,0.2); }
.role-badge.author { color: #2bd64e; background: rgba(43,214,78,0.08); border: 1px solid rgba(43,214,78,0.2); }
.role-badge.reader { color: #8b9098; background: rgba(139,144,152,0.08); border: 1px solid rgba(139,144,152,0.2); }

.status-badge.published { color: #2bd64e; background: rgba(43,214,78,0.08); border: 1px solid rgba(43,214,78,0.2); }
.status-badge.draft { color: #feba0a; background: rgba(254,186,10,0.08); border: 1px solid rgba(254,186,10,0.2); }
.status-badge.archived { color: #8b9098; background: rgba(139,144,152,0.08); border: 1px solid rgba(139,144,152,0.2); }

.muted { font-size: 11px; color: #484b52; }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .data-grid { grid-template-columns: 1fr; }
}

@media (max-width: 500px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
