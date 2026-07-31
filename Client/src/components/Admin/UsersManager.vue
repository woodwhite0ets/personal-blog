<template>
  <div class="users-manager">
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <span class="section-title">cat /etc/passwd</span>
      <span class="section-count">— {{ total }} users</span>
    </div>

    <!-- 筛选 -->
    <div class="filters">
      <div class="status-tabs">
        <button
          v-for="r in roleOptions"
          :key="r.value"
          class="tab"
          :class="{ active: currentRole === r.value }"
          @click="setRole(r.value)"
        >{{ r.label }}</button>
      </div>
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="grep username or email..."
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- 状态 -->
    <div v-if="loading" class="state-box"><span class="spinner"></span><span>loading...</span></div>
    <div v-else-if="error" class="state-box error"><span class="err-prefix">ERR!</span><span>{{ error }}</span></div>
    <div v-else-if="users.length === 0" class="state-box"><span>no users found</span></div>

    <template v-else>
      <div class="table-wrap">
        <table class="user-table">
          <thead>
            <tr>
              <th class="th-avatar"></th>
              <th>username</th>
              <th>email</th>
              <th>role</th>
              <th>verified</th>
              <th>posts</th>
              <th>joined</th>
              <th class="th-actions">actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" :class="{ 'self-row': u.id === currentUser?.id }">
              <td class="td-avatar">
                <span class="avatar-sm">{{ u.nickname.charAt(0).toUpperCase() }}</span>
              </td>
              <td>
                <router-link :to="`/user/${u.username}`" class="user-link">@{{ u.username }}</router-link>
                <span v-if="u.id === currentUser?.id" class="self-tag">you</span>
              </td>
              <td class="muted">{{ u.email }}</td>
              <td>
                <select
                  v-if="u.id !== currentUser?.id"
                  :value="u.role"
                  class="role-select"
                  @change="changeRole(u, ($event.target).value)"
                >
                  <option value="admin">admin</option>
                  <option value="author">author</option>
                  <option value="reader">reader</option>
                </select>
                <span v-else class="role-badge" :class="u.role">{{ u.role }}</span>
              </td>
              <td>
                <span class="verified" :class="{ yes: u.is_verified }">
                  {{ u.is_verified ? '✓' : '✗' }}
                </span>
              </td>
              <td class="muted">{{ u.post_count }}</td>
              <td class="muted">{{ formatDate(u.created_at) }}</td>
              <td class="td-actions">
                <button
                  v-if="u.id !== currentUser?.id"
                  class="btn-sm btn-del"
                  @click="confirmDelete(u)"
                >del</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="hasMore" class="load-more">
        <button class="btn-load-more" :disabled="loadingMore" @click="loadMore">
          <span class="btn-prompt">❯</span>
          {{ loadingMore ? 'loading...' : 'more users' }}
        </button>
      </div>
    </template>

    <!-- 确认弹窗 -->
    <ConfirmModal
      :visible="showDeleteModal"
      :title="`userdel ${deleteTarget?.username}`"
      :message="deleteTarget ? `Delete user @${deleteTarget.username} and all their posts? This cannot be undone.` : ''"
      confirm-text="Delete"
      :danger="true"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuth, getToken } from '../../stores/auth.js'
import ConfirmModal from './ConfirmModal.vue'

const API_BASE = '/api'
const { currentUser } = useAuth()

const users = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const currentRole = ref('')
const searchQuery = ref('')
let searchTimer = null

const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const roleOptions = [
  { value: '', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'author', label: 'Authors' },
  { value: 'reader', label: 'Readers' },
]

const hasMore = computed(() => currentPage.value < totalPages.value)

function setRole(r) {
  currentRole.value = r
  currentPage.value = 1
  users.value = []
  fetchUsers()
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    users.value = []
    fetchUsers()
  }, 300)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().split('T')[0]
}

async function fetchUsers(page = 1) {
  if (page === 1) loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams({ page: String(page) })
    if (currentRole.value) params.set('role', currentRole.value)
    if (searchQuery.value) params.set('search', searchQuery.value)

    const res = await fetch(`${API_BASE}/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || 'fetch failed')
    const data = await res.json()

    if (page === 1) {
      users.value = data.users
    } else {
      users.value.push(...data.users)
    }
    currentPage.value = data.page
    totalPages.value = data.totalPages
    total.value = data.total
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  loadingMore.value = true
  await fetchUsers(currentPage.value + 1)
}

async function changeRole(user, newRole) {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) throw new Error((await res.json()).message || 'update failed')
    user.role = newRole
  } catch (e) {
    error.value = e.message
  }
}

function confirmDelete(user) {
  deleteTarget.value = user
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await fetch(`${API_BASE}/admin/users/${deleteTarget.value.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || 'delete failed')
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id)
    total.value--
    showDeleteModal.value = false
    deleteTarget.value = null
  } catch (e) {
    error.value = e.message
  } finally {
    deleting.value = false
  }
}

onMounted(() => fetchUsers())
</script>

<style scoped>
.users-manager { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px; padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.section-arrow { color: var(--accent); font-weight: 700; }
.section-title { font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: 0.5px; }
.section-count { font-size: 11px; color: var(--text-muted); margin-left: auto; }

.filters {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-bottom: 20px; flex-wrap: wrap;
}
.status-tabs { display: flex; gap: 2px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.tab {
  padding: 6px 16px; font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--text-dim); background: none; border: none; cursor: pointer;
  transition: all 0.2s; letter-spacing: 0.5px;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); background: var(--accent-a6); }

.search-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; background: var(--bg-elevated);
  border: 1px solid var(--border-strong); border-radius: 6px;
  transition: border-color 0.2s;
}
.search-wrap:focus-within { border-color: var(--accent); }
.search-icon { font-size: 12px; }
.search-input {
  font-family: inherit; font-size: 12px; color: var(--text);
  background: none; border: none; outline: none;
  min-width: 200px; caret-color: var(--accent);
}
.search-input::placeholder { color: var(--text-faint); }

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

.table-wrap { overflow-x: auto; }

.user-table { width: 100%; border-collapse: collapse; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.user-table th {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px;
  text-align: left; padding: 10px 14px;
  background: var(--overlay-a15); border-bottom: 1px solid var(--border);
}
.user-table td {
  padding: 10px 14px; font-size: 12px; color: var(--text-secondary);
  border-bottom: 1px solid var(--border-a50);
}
.user-table tbody tr:hover { background: var(--overlay-a15); }
.user-table tbody tr:last-child td { border-bottom: none; }
.self-row { background: var(--accent-a2); }
.th-avatar { width: 32px; }
.th-actions, .td-actions { text-align: right; }

.avatar-sm {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-a8); color: var(--accent);
  border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase;
}

.user-link { color: var(--accent); text-decoration: none; transition: opacity 0.2s; }
.user-link:hover { opacity: 0.8; }

.self-tag {
  font-size: 9px; font-weight: 700; color: var(--text-dim);
  padding: 1px 6px; background: var(--overlay-a4);
  border: 1px solid var(--overlay-a8); border-radius: 3px;
  margin-left: 6px; vertical-align: middle;
}

.role-select {
  font-family: inherit; font-size: 11px; font-weight: 600; color: var(--accent);
  background: var(--accent-a6); border: 1px solid var(--accent-a20);
  border-radius: 4px; padding: 3px 8px; outline: none; cursor: pointer;
}
.role-select option { background: var(--bg-float); color: var(--text); }

.role-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  padding: 2px 8px; border-radius: 3px; text-transform: uppercase;
}
.role-badge.admin { color: var(--accent); background: var(--accent-a8); border: 1px solid var(--accent-a20); }
.role-badge.author { color: var(--ok); background: var(--ok-a8); border: 1px solid var(--ok-a20); }
.role-badge.reader { color: var(--text-secondary); background: var(--text-secondary-a8); border: 1px solid var(--text-secondary-a20); }

.verified { color: var(--text-muted); font-weight: 700; }
.verified.yes { color: var(--ok); }

.muted { font-size: 11px; color: var(--text-muted); }

.btn-sm {
  padding: 4px 12px; font-family: inherit; font-size: 11px; font-weight: 600;
  border-radius: 4px; cursor: pointer; transition: all 0.2s;
  border: 1px solid transparent; display: inline-block;
}
.btn-del { color: var(--err); background: var(--err-a6); border-color: var(--err-a20); }
.btn-del:hover { background: var(--err-a12); border-color: var(--err); }

.load-more { text-align: center; padding: 28px 0 12px; }
.btn-load-more {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 28px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: var(--text-dim); background: none; border: 1px solid var(--border-strong);
  border-radius: 6px; cursor: pointer; transition: all 0.2s;
}
.btn-load-more:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-load-more:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-prompt { color: var(--accent); }
</style>
