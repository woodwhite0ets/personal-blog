<template>
  <div class="dashboard">
    <div class="section-head">
      <h1 class="section-title">仪表盘</h1>
    </div>

    <div v-if="loading" class="state-box" role="status" aria-live="polite">
      <span class="spinner" role="status" aria-label="加载中"></span>
      <span class="state-text">正在加载统计...</span>
    </div>

    <template v-else-if="stats">
      <!-- 统计：发丝线分区 -->
      <div class="stats-grid">
        <div class="stat-cell">
          <span class="stat-number">{{ stats.users || 0 }}</span>
          <span class="stat-sub">注册用户</span>
        </div>
        <div class="stat-cell">
          <span class="stat-number">{{ stats.posts.total }}</span>
          <span class="stat-sub">文章总数</span>
        </div>
        <div class="stat-cell">
          <span class="stat-number" style="color:var(--ok)">{{ stats.posts.published }}</span>
          <span class="stat-sub">已上线文章</span>
        </div>
        <div class="stat-cell">
          <span class="stat-number" style="color:var(--warn)">{{ stats.posts.draft }}</span>
          <span class="stat-sub">未发布草稿</span>
        </div>
      </div>

      <!-- 最近数据 -->
      <div class="data-grid">
        <div class="data-panel">
          <div class="panel-bar">
            <span class="panel-title deco-rule">最近用户动态</span>
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
            <span class="panel-title deco-rule">最近文章动态</span>
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

    <div v-else-if="error" class="state-box error" role="alert">
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
.section-title { font-family: var(--font-hand); font-size: 22px; font-weight: 400; color: var(--text-bright); letter-spacing: 0; }

.state-box {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px 20px; font-size: 13px; color: var(--text-muted);
}
.state-box.error { color: var(--err); flex-direction: column; gap: 8px; }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--border); border-top-color: var(--accent);
  border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 卡片网格 */
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
}

.stat-cell {
  display: flex; flex-direction: column; gap: 4px;
  padding: 20px 18px; border-left: 1px solid var(--border);
}
.stat-cell:first-child { border-left: none; }

.stat-number { font-size: 32px; font-weight: 800; color: var(--text-bright); line-height: 1; }
.stat-sub { font-size: 11px; color: var(--text-muted); }

/* 数据面板 */
.data-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
}

.data-panel {
  background: transparent; border: none; border-radius: 0; box-shadow: none;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  border-bottom: none; background: transparent; padding: 0 0 12px;
}
.panel-title {
  flex: 1; font-family: var(--font-hand); font-size: 17px; font-weight: 400;
  color: var(--text-bright); text-align: left; letter-spacing: 0;
}

.panel-body { padding: 0; }

/* 表格 */
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px;
  text-align: left; padding: 10px 14px 10px 0;
  border-bottom: 1px solid var(--border);
}
.data-table td {
  padding: 9px 14px 9px 0; font-size: 12px; color: var(--text-secondary);
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
  .stat-cell:nth-child(3) { border-left: none; }
  .stat-cell:nth-child(n+3) { border-top: 1px solid var(--border); }
  .data-grid { grid-template-columns: 1fr; }
}

@media (max-width: 500px) {
  .stats-grid { grid-template-columns: 1fr; }
  .stat-cell { border-left: none; border-top: 1px solid var(--border); }
  .stat-cell:first-child { border-top: none; }
}
</style>
