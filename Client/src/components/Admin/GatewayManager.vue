<template>
  <div class="gateway-manager">
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <span class="section-title">cat gateway-auth.yaml</span>
      <span class="section-count">— {{ users.length }} 个网关授权用户</span>
    </div>

    <p class="hint">
      账号已与博客打通：网关授权是挂在<b>博客用户</b>上的权限（网关角色 + 知识库项目 + SSH 服务器）。
      这里管理"哪些博客用户能访问网关 /gateway 控制台与 MCP"。
    </p>

    <div v-if="serviceError" class="state-box error">
      <span class="err-prefix">ERR!</span><span>{{ serviceError }}</span>
    </div>

    <div v-if="loading" class="state-box"><span class="spinner"></span><span>正在加载...</span></div>

    <template v-else>
      <div class="toolbar">
        <p class="muted">一次性 token 只显示一次，请立即复制保存。</p>
        <button class="btn-primary" @click="openGrant">开通网关权限</button>
      </div>

      <div v-if="tokenNotice" class="token-notice">
        <strong>请立即保存此 Token（仅显示一次）</strong>
        <code>{{ tokenNotice }}</code>
        <button class="btn-close" @click="tokenNotice = ''">×</button>
      </div>

      <div class="table-wrap">
        <table class="user-table">
          <thead>
            <tr>
              <th>网关ID</th>
              <th>博客用户</th>
              <th>网关角色</th>
              <th>项目</th>
              <th>服务器</th>
              <th class="th-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="String(u.id)">
              <td><span class="tag">{{ u.id }}</span></td>
              <td>
                <template v-if="u.blog">
                  <span class="user-link">@{{ u.blog.username }}</span>
                  <span class="muted">（{{ u.blog.nickname || '-' }}）</span>
                  <br><span class="muted">{{ u.blog.email }} · {{ u.blog.role }}<span v-if="u.blog.is_verified"> · ✓</span></span>
                </template>
                <span v-else class="muted">非博客账号（{{ u.username || u.display_name }}）</span>
              </td>
              <td><span class="role-badge" :class="u.role">{{ u.role }}</span></td>
              <td>{{ u.allowed_projects?.length || 0 }}</td>
              <td>{{ u.allowed_targets?.length || 0 }}</td>
              <td class="td-actions">
                <button class="btn-sm" @click="openEdit(u)">权限</button>
                <button class="btn-sm" @click="rotate(u)">轮换Token</button>
                <button class="btn-sm btn-del" @click="confirmDelete(u)">移除</button>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="6" class="empty">暂无网关授权用户 — 点击"开通网关权限"添加</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- 开通网关权限 -->
    <div v-if="grantVisible" class="modal-mask" @click.self="grantVisible = false">
      <div class="modal-card">
        <h3>开通网关权限</h3>
        <p class="muted">选择一个博客用户，授予网关访问（签发 mcp_ token）。</p>
        <label>博客用户</label>
        <select v-model="grantDraft.blogUserId">
          <option value="" disabled>选择博客用户...</option>
          <option v-for="b in eligibleBlogUsers" :key="b.id" :value="String(b.id)">@{{ b.username }}（{{ b.nickname || '-' }} · {{ b.role }}）</option>
        </select>
        <div v-if="!eligibleBlogUsers.length" class="muted">所有博客用户都已开通，或暂无用户</div>
        <label>网关角色</label>
        <select v-model="grantDraft.role">
          <option value="operator">operator：操作员（MCP + SSH）</option>
          <option value="admin">admin：管理员</option>
        </select>
        <label>知识库项目</label>
        <div class="access-grid">
          <label v-for="p in projects" :key="p.id" class="check-option">
            <input v-model="grantDraft.projects" type="checkbox" :value="p.id" /><span>{{ p.id }}</span>
          </label>
          <span v-if="!projects.length" class="muted">暂无项目</span>
        </div>
        <label>SSH 服务器</label>
        <div class="access-grid">
          <label v-for="t in targets" :key="t.id" class="check-option">
            <input v-model="grantDraft.targets" type="checkbox" :value="t.id" /><span>{{ t.id }}（{{ t.label }}）</span>
          </label>
          <span v-if="!targets.length" class="muted">暂无服务器</span>
        </div>
        <div class="actions">
          <button class="btn-secondary" @click="grantVisible = false">取消</button>
          <button class="btn-primary" :disabled="!grantDraft.blogUserId" @click="submitGrant">开通并签发 Token</button>
        </div>
      </div>
    </div>

    <!-- 编辑权限 -->
    <div v-if="editVisible" class="modal-mask" @click.self="editVisible = false">
      <div class="modal-card">
        <h3>编辑网关权限 — {{ editTarget.blog?.username || editTarget.id }}</h3>
        <label>网关角色</label>
        <select v-model="editDraft.role">
          <option value="operator">operator：操作员</option>
          <option value="admin">admin：管理员</option>
        </select>
        <label>知识库项目</label>
        <div class="access-grid">
          <label v-for="p in projects" :key="p.id" class="check-option">
            <input v-model="editDraft.projects" type="checkbox" :value="p.id" /><span>{{ p.id }}</span>
          </label>
          <span v-if="!projects.length" class="muted">暂无项目</span>
        </div>
        <label>SSH 服务器</label>
        <div class="access-grid">
          <label v-for="t in targets" :key="t.id" class="check-option">
            <input v-model="editDraft.targets" type="checkbox" :value="t.id" /><span>{{ t.id }}（{{ t.label }}）</span>
          </label>
          <span v-if="!targets.length" class="muted">暂无服务器</span>
        </div>
        <div class="actions">
          <button class="btn-secondary" @click="editVisible = false">取消</button>
          <button class="btn-primary" @click="submitEdit">保存权限</button>
        </div>
      </div>
    </div>

    <!-- 确认移除 -->
    <ConfirmModal
      :visible="deleteVisible"
      :title="`移除网关访问 ${deleteTarget?.blog?.username || deleteTarget?.id}`"
      :message="`移除后该博客用户将无法登录 /gateway 控制台，MCP token 立即失效。博客账号本身不受影响。`"
      confirm-text="移除"
      :danger="true"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="deleteVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getToken } from '../../stores/auth.js'
import ConfirmModal from './ConfirmModal.vue'

const API_BASE = '/api'

const users = ref([])
const projects = ref([])
const targets = ref([])
const blogUsers = ref([])
const loading = ref(true)
const serviceError = ref('')
const tokenNotice = ref('')

const grantVisible = ref(false)
const grantDraft = ref({ blogUserId: '', role: 'operator', projects: [], targets: [] })
const editVisible = ref(false)
const editTarget = ref(null)
const editDraft = ref({ role: 'operator', projects: [], targets: [] })
const deleteVisible = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const eligibleBlogUsers = computed(() => {
  const gwIds = new Set(users.value.map((u) => String(u.id)))
  return blogUsers.value.filter((b) => !gwIds.has(String(b.id)))
})

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${getToken()}`, ...(options.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`)
  return body
}

async function load() {
  loading.value = true
  serviceError.value = ''
  try {
    const [gw, blog] = await Promise.all([
      api('/admin/gateway/users'),
      api('/admin/users?perPage=1000'),
    ])
    users.value = gw.users || []
    projects.value = gw.projects || []
    targets.value = gw.targets || []
    blogUsers.value = blog.users || []
  } catch (e) {
    serviceError.value = e.message
  } finally {
    loading.value = false
  }
}

function openGrant() {
  grantDraft.value = { blogUserId: '', role: 'operator', projects: [], targets: [] }
  grantVisible.value = true
}

async function submitGrant() {
  try {
    const res = await api('/admin/gateway/users', {
      method: 'POST',
      body: JSON.stringify({
        blog_user_id: Number(grantDraft.value.blogUserId),
        role: grantDraft.value.role,
        allowed_projects: grantDraft.value.projects,
        allowed_targets: grantDraft.value.targets,
        target_permissions: Object.fromEntries(grantDraft.value.targets.map((t) => [t, 'operator'])),
      }),
    })
    tokenNotice.value = res.token || ''
    grantVisible.value = false
    await load()
  } catch (e) {
    serviceError.value = e.message
  }
}

function openEdit(u) {
  editTarget.value = u
  editDraft.value = {
    role: u.role,
    projects: [...(u.allowed_projects || [])],
    targets: [...(u.allowed_targets || [])],
  }
  editVisible.value = true
}

async function submitEdit() {
  if (!editTarget.value) return
  try {
    await api(`/admin/gateway/users/${encodeURIComponent(editTarget.value.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        role: editDraft.value.role,
        allowed_projects: editDraft.value.projects,
        allowed_targets: editDraft.value.targets,
        target_permissions: Object.fromEntries(editDraft.value.targets.map((t) => [t, 'operator'])),
      }),
    })
    editVisible.value = false
    await load()
  } catch (e) {
    serviceError.value = e.message
  }
}

async function rotate(u) {
  if (!confirm(`轮换 ${u.blog?.username || u.id} 的 MCP Token？旧 Token 立即失效。`)) return
  try {
    const res = await api(`/admin/gateway/users/${encodeURIComponent(u.id)}/rotate-token`, { method: 'POST' })
    tokenNotice.value = res.token || ''
  } catch (e) {
    serviceError.value = e.message
  }
}

function confirmDelete(u) {
  deleteTarget.value = u
  deleteVisible.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api(`/admin/gateway/users/${encodeURIComponent(deleteTarget.value.id)}`, { method: 'DELETE' })
    deleteVisible.value = false
    deleteTarget.value = null
    await load()
  } catch (e) {
    serviceError.value = e.message
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.gateway-manager { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.section-arrow { color: var(--accent); font-weight: 700; }
.section-title { font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: 0.5px; }
.section-count { font-size: 11px; color: var(--text-muted); margin-left: auto; }

.hint { font-size: 12px; color: var(--text-dim); line-height: 1.7; margin: 0 0 16px; padding: 10px 14px; background: var(--overlay-a4); border: 1px solid var(--border); border-radius: 6px; }
.hint b { color: var(--accent); }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar p { margin: 0; font-size: 11px; }

.token-notice { position: relative; display: grid; gap: 8px; padding: 14px 16px; margin-bottom: 16px; color: var(--warn); background: var(--warn-a8); border: 1px solid var(--warn-a20); border-radius: 6px; font-size: 12px; }
.token-notice code { color: var(--text-bright); overflow-wrap: anywhere; white-space: pre-wrap; }
.btn-close { position: absolute; top: 6px; right: 10px; background: none; border: 0; color: var(--text-dim); font-size: 16px; cursor: pointer; }

.btn-primary, .btn-secondary { font: inherit; cursor: pointer; border-radius: 6px; transition: all .2s; }
.btn-primary { padding: 9px 14px; color: var(--on-accent); background: var(--accent); border: 1px solid var(--accent); font-weight: 700; }
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }
.btn-primary:disabled { opacity: .5; cursor: not-allowed; }
.btn-secondary { padding: 9px 13px; color: var(--text-secondary); background: var(--overlay-a4); border: 1px solid var(--border-strong); }
.btn-secondary:hover { color: var(--text); border-color: var(--accent); }

.state-box { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 40px 20px; font-size: 13px; color: var(--text-muted); }
.state-box.error { color: var(--err); flex-direction: column; gap: 8px; }
.err-prefix { font-weight: 700; letter-spacing: 1px; }
.spinner { width: 16px; height: 16px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-wrap { overflow-x: auto; }
.user-table { width: 100%; border-collapse: collapse; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.user-table th { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; text-align: left; padding: 10px 14px; background: var(--overlay-a15); border-bottom: 1px solid var(--border); }
.user-table td { padding: 10px 14px; font-size: 12px; color: var(--text-secondary); border-bottom: 1px solid var(--border-a50); }
.user-table tbody tr:hover { background: var(--overlay-a15); }
.user-table tbody tr:last-child td { border-bottom: none; }
.th-actions, .td-actions { text-align: right; }
.td-actions .btn-sm { margin-left: 4px; }
.empty { text-align: center; color: var(--text-dim); padding: 24px !important; }

.tag { display: inline-block; padding: 2px 7px; color: var(--text-dim); border: 1px solid var(--border-strong); border-radius: 4px; font-size: 10px; }
.user-link { color: var(--accent); }
.muted { font-size: 11px; color: var(--text-muted); }
.role-badge { font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 2px 8px; border-radius: 3px; text-transform: uppercase; }
.role-badge.admin { color: var(--accent); background: var(--accent-a8); border: 1px solid var(--accent-a20); }
.role-badge.operator { color: var(--ok); background: var(--ok-a8); border: 1px solid var(--ok-a20); }

.btn-sm { padding: 4px 10px; font-family: inherit; font-size: 11px; font-weight: 600; border-radius: 4px; cursor: pointer; transition: all 0.2s; border: 1px solid var(--border-strong); color: var(--text-secondary); background: var(--overlay-a4); }
.btn-sm:hover { border-color: var(--accent); color: var(--text); }
.btn-del { color: var(--err); background: var(--err-a6); border-color: var(--err-a20); }
.btn-del:hover { background: var(--err-a12); border-color: var(--err); }

.modal-mask { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,.55); }
.modal-card { width: min(560px, 100%); max-height: 86vh; overflow-y: auto; padding: 22px; background: var(--bg-float); border: 1px solid var(--border-strong); border-radius: 10px; }
.modal-card h3 { margin: 0 0 6px; color: var(--text-bright); font-size: 16px; }
.modal-card label { display: block; margin: 14px 0 6px; color: var(--text-secondary); font-size: 12px; }
.modal-card select { width: 100%; box-sizing: border-box; padding: 9px 12px; color: var(--text); font: inherit; font-size: 12px; background: var(--bg-code); border: 1px solid var(--border-strong); border-radius: 6px; }
.access-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; }
.check-option { display: flex !important; align-items: center; gap: 8px; margin: 0 !important; padding: 8px 10px; color: var(--text-secondary); background: var(--overlay-a4); border: 1px solid var(--border); border-radius: 5px; cursor: pointer; }
.check-option input { width: auto !important; accent-color: var(--accent); }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
</style>
