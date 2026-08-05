<template>
  <div class="dashboard">
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <span class="section-title">cat /proc/dashboard</span>
    </div>

    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span class="state-text">正在加载统计...</span>
    </div>

    <template v-else-if="stats">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot dot-green"></span>
            <span class="stat-label">用户</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number">{{ stats.users || 0 }}</span>
            <span class="stat-sub">注册用户</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot dot-cyan"></span>
            <span class="stat-label">文章</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number">{{ stats.posts.total }}</span>
            <span class="stat-sub">文章总数</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot" style="background:var(--ok)"></span>
            <span class="stat-label">已发布</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number" style="color:var(--ok)">{{ stats.posts.published }}</span>
            <span class="stat-sub">已上线文章</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card-bar">
            <span class="stat-dot dot-yellow"></span>
            <span class="stat-label">草稿</span>
          </div>
          <div class="stat-card-body">
            <span class="stat-number" style="color:var(--warn)">{{ stats.posts.draft }}</span>
            <span class="stat-sub">未发布草稿</span>
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
                <tr><th>用户名</th><th>角色</th><th>注册时间</th></tr>
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
                <tr><th>标题</th><th>状态</th><th>作者</th></tr>
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
    if (!res.ok) throw new Error((await res.json()).message || '获取失败')
    stats.value = await res.json()
  } catch (e) {
    error.value = e.message || '连接被拒绝'
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
  border-bottom: 1px solid var(--border);
}
.section-arrow { color: var(--accent); font-weight: 700; }
.section-title { font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: 0.5px; }

.state-box {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 20px; font-size: 13px; color: var(--text-muted);
}
.state-box.error { color: var(--err); flex-direction: column; gap: 8px; }
.err-prefix { font-weight: 700; letter-spacing: 1px; }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 卡片网格 */
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
  transition: border-color 0.2s;
}
.stat-card:hover { border-color: var(--border-strong); }

.stat-card-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}
.stat-dot { width: 7px; height: 7px; border-radius: 50%; }
.dot-cyan { background: var(--accent); }
.dot-green { background: var(--ok); }
.dot-yellow { background: var(--warn); }
.stat-label {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  letter-spacing: 1.5px; text-transform: lowercase;
}

.stat-card-body {
  padding: 16px; display: flex; flex-direction: column; gap: 4px;
}

.stat-number { font-size: 32px; font-weight: 800; color: var(--text-bright); line-height: 1; }
.stat-sub { font-size: 11px; color: var(--text-muted); }

/* 数据面板 */
.data-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}

.data-panel {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dim { opacity: 0.3; }
.panel-title {
  flex: 1; font-size: 10px; font-weight: 600;
  color: var(--text-muted); text-align: center; letter-spacing: 1px;
}

.panel-body { padding: 0; }

/* 表格 */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px;
  text-align: left; padding: 10px 14px;
  background: var(--overlay-a1);
  border-bottom: 1px solid var(--border);
}
.data-table td {
  padding: 9px 14px; font-size: 12px; color: var(--text-secondary);
  border-bottom: 1px solid var(--border-a50);
}
.data-table tbody tr:hover { background: var(--overlay-a15); }
.data-table tbody tr:last-child td { border-bottom: none; }

.user-link { color: var(--accent); text-decoration: none; transition: opacity 0.2s; }
.user-link:hover { opacity: 0.8; }

.role-badge, .status-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  padding: 2px 8px; border-radius: 3px; text-transform: uppercase;
}
.role-badge.admin { color: var(--accent); background: var(--accent-a8); border: 1px solid var(--accent-a20); }
.role-badge.author { color: var(--ok); background: var(--ok-a8); border: 1px solid var(--ok-a20); }
.role-badge.reader { color: var(--text-secondary); background: var(--text-secondary-a8); border: 1px solid var(--text-secondary-a20); }

.status-badge.published { color: var(--ok); background: var(--ok-a8); border: 1px solid var(--ok-a20); }
.status-badge.draft { color: var(--warn); background: var(--warn-a8); border: 1px solid var(--warn-a20); }
.status-badge.archived { color: var(--text-secondary); background: var(--text-secondary-a8); border: 1px solid var(--text-secondary-a20); }

.muted { font-size: 11px; color: var(--text-muted); }

@media (max-width: 900px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .data-grid { grid-template-columns: 1fr; }
}

@media (max-width: 500px) {
  .stats-grid { grid-template-columns: 1fr; }
}
</style>
