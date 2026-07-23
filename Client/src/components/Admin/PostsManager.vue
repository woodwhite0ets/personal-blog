<template>
  <div class="posts-manager">
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <span class="section-title">ls -la /var/posts</span>
      <span class="section-count">— {{ total }} entries</span>
    </div>

    <!-- 筛选栏 -->
    <div class="filters">
      <div class="status-tabs">
        <button
          v-for="s in statuses"
          :key="s.value"
          class="tab"
          :class="{ active: currentStatus === s.value }"
          @click="setStatus(s.value)"
        >{{ s.label }}</button>
      </div>
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="grep title or author..."
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span>loading...</span>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="state-box error">
      <span class="err-prefix">ERR!</span>
      <span>{{ error }}</span>
    </div>

    <!-- 无数据 -->
    <div v-else-if="posts.length === 0" class="state-box">
      <span>no posts found</span>
    </div>

    <!-- 文章表格 -->
    <template v-else>
      <div class="table-wrap">
        <table class="post-table">
          <thead>
            <tr>
              <th>title</th>
              <th>status</th>
              <th>author</th>
              <th>date</th>
              <th class="th-actions">actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in posts" :key="p.id">
              <td>
                <router-link :to="`/post/${p.slug}`" class="post-link">{{ p.title }}</router-link>
                <span v-if="p.is_pinned" class="pinned-tag">PINNED</span>
              </td>
              <td><span class="status-badge" :class="p.status">{{ p.status }}</span></td>
              <td>
                <router-link :to="`/user/${p.username || p.author?.username}`" class="author-link">
                  @{{ p.username || p.author?.username }}
                </router-link>
              </td>
              <td class="muted">{{ p.date }}</td>
              <td class="td-actions">
                <router-link :to="`/editor/${p.slug}`" class="btn-sm btn-edit">edit</router-link>
                <button class="btn-sm btn-del" @click="confirmDelete(p)">del</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 分页 -->
      <div v-if="hasMore" class="load-more">
        <button class="btn-load-more" :disabled="loadingMore" @click="loadMore">
          <span class="btn-prompt">❯</span>
          {{ loadingMore ? 'loading...' : 'more posts' }}
        </button>
      </div>
    </template>

    <!-- 确认删除弹窗 -->
    <ConfirmModal
      :visible="showDeleteModal"
      :title="`rm -rf ./posts/${deleteTarget?.slug}`"
      :message="deleteTarget ? 'Permanently delete &quot;' + deleteTarget.title + '&quot;? This cannot be undone.' : ''"
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
import { getToken } from '../../stores/auth.js'
import ConfirmModal from './ConfirmModal.vue'

const API_BASE = '/api'

const posts = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const currentStatus = ref('all')
const searchQuery = ref('')
let searchTimer = null

// 删除状态
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const statuses = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
]

const hasMore = computed(() => currentPage.value < totalPages.value)

function setStatus(s) {
  currentStatus.value = s
  currentPage.value = 1
  posts.value = []
  fetchPosts()
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    posts.value = []
    fetchPosts()
  }, 300)
}

async function fetchPosts(page = 1) {
  if (page === 1) loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams({
      page: String(page),
      status: currentStatus.value,
    })
    if (searchQuery.value) params.set('search', searchQuery.value)

    const res = await fetch(`${API_BASE}/admin/posts?${params}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || 'fetch failed')
    const data = await res.json()

    if (page === 1) {
      posts.value = data.posts
    } else {
      posts.value.push(...data.posts)
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
  await fetchPosts(currentPage.value + 1)
}

function confirmDelete(post) {
  deleteTarget.value = post
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await fetch(`${API_BASE}/posts/${deleteTarget.value.slug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || 'delete failed')
    posts.value = posts.value.filter(p => p.slug !== deleteTarget.value.slug)
    total.value--
    showDeleteModal.value = false
    deleteTarget.value = null
  } catch (e) {
    error.value = e.message
  } finally {
    deleting.value = false
  }
}

onMounted(() => fetchPosts())
</script>

<style scoped>
.posts-manager { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.section-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 20px; padding-bottom: 12px;
  border-bottom: 1px solid #1c1d21;
}
.section-arrow { color: #00d4ff; font-weight: 700; }
.section-title { font-size: 13px; font-weight: 600; color: #c9d1d9; letter-spacing: 0.5px; }
.section-count { font-size: 11px; color: #484b52; margin-left: auto; }

/* 筛选 */
.filters {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin-bottom: 20px; flex-wrap: wrap;
}

.status-tabs { display: flex; gap: 2px; background: #0f1013; border: 1px solid #1c1d21; border-radius: 6px; overflow: hidden; }
.tab {
  padding: 6px 16px; font-family: inherit; font-size: 11px; font-weight: 600;
  color: #6e737a; background: none; border: none; cursor: pointer;
  transition: all 0.2s; letter-spacing: 0.5px;
}
.tab:hover { color: #c9d1d9; }
.tab.active { color: #00d4ff; background: rgba(0,212,255,0.06); }

.search-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; background: #0f1013;
  border: 1px solid #25262a; border-radius: 6px;
  transition: border-color 0.2s;
}
.search-wrap:focus-within { border-color: #00d4ff; }
.search-icon { font-size: 12px; }
.search-input {
  font-family: inherit; font-size: 12px; color: #c9d1d9;
  background: none; border: none; outline: none;
  min-width: 200px; caret-color: #00d4ff;
}
.search-input::placeholder { color: #33363c; }

/* 状态 */
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

/* 表格 */
.table-wrap { overflow-x: auto; }

.post-table { width: 100%; border-collapse: collapse; background: #0f1013; border: 1px solid #1c1d21; border-radius: 8px; overflow: hidden; }
.post-table th {
  font-size: 10px; font-weight: 600; color: #484b52;
  text-transform: uppercase; letter-spacing: 1px;
  text-align: left; padding: 10px 14px;
  background: rgba(255,255,255,0.015); border-bottom: 1px solid #1c1d21;
}
.post-table td {
  padding: 10px 14px; font-size: 12px; color: #8b9098;
  border-bottom: 1px solid rgba(28,29,33,0.5);
}
.post-table tbody tr:hover { background: rgba(255,255,255,0.015); }
.post-table tbody tr:last-child td { border-bottom: none; }
.th-actions, .td-actions { text-align: right; }

.post-link { color: #00d4ff; text-decoration: none; transition: opacity 0.2s; }
.post-link:hover { opacity: 0.8; }
.author-link { color: #8b9098; text-decoration: none; transition: color 0.2s; }
.author-link:hover { color: #00d4ff; }

.pinned-tag {
  font-size: 9px; font-weight: 700; letter-spacing: 1px;
  color: #feba0a; padding: 1px 6px;
  background: rgba(254,186,10,0.08); border: 1px solid rgba(254,186,10,0.2);
  border-radius: 3px; margin-left: 6px; vertical-align: middle;
}

.status-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  padding: 2px 8px; border-radius: 3px; text-transform: uppercase;
}
.status-badge.published { color: #2bd64e; background: rgba(43,214,78,0.08); border: 1px solid rgba(43,214,78,0.2); }
.status-badge.draft { color: #feba0a; background: rgba(254,186,10,0.08); border: 1px solid rgba(254,186,10,0.2); }
.status-badge.archived { color: #8b9098; background: rgba(139,144,152,0.08); border: 1px solid rgba(139,144,152,0.2); }

.muted { font-size: 11px; color: #484b52; }

.btn-sm {
  padding: 4px 12px; font-family: inherit; font-size: 11px; font-weight: 600;
  border-radius: 4px; text-decoration: none; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent;
  margin-left: 6px; display: inline-block;
}
.btn-edit { color: #00d4ff; background: rgba(0,212,255,0.06); border-color: rgba(0,212,255,0.2); }
.btn-edit:hover { background: rgba(0,212,255,0.12); }
.btn-del { color: #ff5f57; background: rgba(255,95,87,0.06); border-color: rgba(255,95,87,0.2); }
.btn-del:hover { background: rgba(255,95,87,0.12); border-color: #ff5f57; }

/* 加载更多 */
.load-more { text-align: center; padding: 28px 0 12px; }

.btn-load-more {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 28px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #6e737a; background: none; border: 1px solid #25262a;
  border-radius: 6px; cursor: pointer; transition: all 0.2s;
}
.btn-load-more:hover:not(:disabled) { border-color: #00d4ff; color: #00d4ff; }
.btn-load-more:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-prompt { color: #00d4ff; }
</style>
