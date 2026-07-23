<template>
  <div class="post-detail-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <!-- ====== 导航栏 ====== -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/post</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/HomePage">
            <span class="nav-num">01</span> home
          </router-link>
          <router-link to="/archive">
            <span class="nav-num">02</span> archive
          </router-link>
          <router-link to="/about">
            <span class="nav-num">03</span> about
          </router-link>
        </nav>
        <div class="nav-actions">
          <button class="btn-search" title="search" v-if="false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <router-link v-if="isLoggedIn" to="/editor" class="btn-write">
            <span class="btn-write-icon">+</span> new post
          </router-link>
        </div>
      </div>
    </header>

    <!-- ====== 加载状态 ====== -->
    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span class="state-text">loading post...</span>
    </div>

    <!-- ====== 错误状态 ====== -->
    <div v-else-if="error" class="state-box error">
      <span class="err-prefix">ERR!</span>
      <span class="state-text">{{ error }}</span>
      <router-link to="/HomePage" class="link-btn">← back to home</router-link>
    </div>

    <!-- ====== 文章内容 ====== -->
    <template v-else-if="post">
      <!-- 封面图 -->
      <div v-if="post.cover_image" class="cover-wrap">
        <img :src="post.cover_image" :alt="post.title" class="cover-img" />
      </div>

      <article class="post-article">
        <!-- 标签 -->
        <div class="post-meta-top">
          <span class="post-tag">{{ post.tag }}</span>
          <span v-if="isAuthor" class="post-badge">author</span>
        </div>

        <!-- 标题 -->
        <h1 class="post-title">{{ post.title }}</h1>

        <!-- 元信息 -->
        <div class="post-meta-line">
          <router-link v-if="post.author" :to="`/user/${post.author.username}`" class="post-author-link">
            <span class="author-avatar-sm">{{ (post.author.nickname || post.author.username).charAt(0).toUpperCase() }}</span>
            <span class="author-name">@{{ post.author.username }}</span>
          </router-link>
          <span class="meta-sep"></span>
          <span class="meta-item">{{ post.date }}</span>
          <span class="meta-sep"></span>
          <span class="meta-item">{{ post.read_time }}</span>
        </div>

        <!-- 正文 -->
        <div class="post-content markdown-body" v-html="renderedContent"></div>

        <!-- 底部操作 -->
        <div class="post-actions">
          <router-link v-if="canEdit" :to="`/editor/${post.slug || post.id}`" class="btn-edit">
            <span class="btn-icon">✎</span> edit this post
          </router-link>
          <button v-if="canDelete" class="btn-delete" @click="confirmDeletePost">
            <span class="btn-icon">🗑</span> delete this post
          </button>
          <router-link to="/HomePage" class="btn-back">
            <span class="btn-icon">←</span> back to home
          </router-link>
        </div>
      </article>

      <!-- 作者卡片 -->
      <div v-if="post.author" class="author-card">
        <router-link :to="`/user/${post.author.username}`" class="author-card-inner">
          <div class="author-avatar-md">{{ (post.author.nickname || post.author.username).charAt(0).toUpperCase() }}</div>
          <div class="author-card-body">
            <span class="author-card-name">@{{ post.author.username }}</span>
            <span v-if="post.author.nickname" class="author-card-nick">{{ post.author.nickname }}</span>
            <span class="author-card-bio" v-if="post.author.bio">{{ post.author.bio }}</span>
          </div>
          <span class="author-card-arrow">→</span>
        </router-link>
      </div>
    </template>

    <!-- ====== 页脚 ====== -->
    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">cat ./posts/{{ slug }}.md</span>
      </div>
    </footer>

    <!-- 确认弹窗 -->
    <ConfirmModal
      :visible="showDeleteModal"
      :title="`rm -rf ./posts/${post?.slug || slug}`"
      :message="'Permanently delete &quot;' + (post?.title || '') + '&quot;? This cannot be undone.'"
      confirm-text="Delete"
      :danger="true"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAuth, getToken } from '../../stores/auth.js'
import ConfirmModal from '../Admin/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, isAdmin } = useAuth()

const API_BASE = '/api'

const slug = computed(() => route.params.slug)

// ====== 状态 ======
const post = ref(null)
const loading = ref(true)
const error = ref('')

// 删除确认
const showDeleteModal = ref(false)
const deleting = ref(false)

function confirmDeletePost() {
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!post.value) return
  deleting.value = true
  try {
    const res = await fetch(`${API_BASE}/posts/${post.value.slug || slug.value}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (!res.ok) throw new Error((await res.json()).message || 'delete failed')
    router.push('/HomePage')
  } catch (e) {
    error.value = e.message
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

// ====== 当前用户是否为作者 ======
const isAuthor = computed(() => {
  if (!currentUser.value || !post.value?.author) return false
  return currentUser.value.username === post.value.author.username
})
const canEdit = computed(() => isAuthor.value || isAdmin.value)
const canDelete = computed(() => isAuthor.value || isAdmin.value)

// ====== Markdown 渲染（XSS 消毒） ======
const renderedContent = computed(() => {
  if (!post.value?.content) return ''
  const raw = marked(post.value.content)
  return DOMPurify.sanitize(raw)
})

// ====== 获取文章 ======
async function fetchPost() {
  loading.value = true
  error.value = ''

  try {
    const res = await fetch(`${API_BASE}/posts/${slug.value}`)
    const data = await res.json()

    if (!res.ok) {
      if (res.status === 404) throw new Error('post not found')
      throw new Error(data.message || 'request failed')
    }

    post.value = data.post
  } catch (e) {
    error.value = e.message || '获取文章失败'
  } finally {
    loading.value = false
  }
}

// ====== 生命周期 ======
onMounted(fetchPost)
watch(slug, fetchPost)
</script>

<style scoped>
.post-detail-page {
  min-height: 100vh;
  background: #0a0a0c;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9;
  position: relative;
  overflow-x: hidden;
}

/* 背景 */
.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

.bg-scanline {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
  );
  pointer-events: none; z-index: 0;
  animation: scan 8s linear infinite;
}

@keyframes scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}

/* ====== Navbar ====== */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,12,0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid #1c1d21;
}

.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}

.brand {
  display: flex; align-items: baseline; gap: 4px;
  text-decoration: none; font-size: 14px; font-weight: 600;
}

.brand-bracket { color: #484b52; }
.brand-text { color: #00d4ff; }
.brand-path { color: #6e737a; margin-left: 8px; font-size: 12px; }

.nav-links { display: flex; gap: 28px; flex: 1; }

.nav-links a {
  display: flex; align-items: center; gap: 6px;
  text-decoration: none; font-size: 12px; font-weight: 500;
  color: #6e737a; transition: color 0.2s; letter-spacing: 0.5px;
}

.nav-num { color: #33363c; font-size: 10px; font-weight: 700; }

.nav-links a:hover,
.nav-links a.router-link-active { color: #c9d1d9; }
.nav-links a.router-link-active .nav-num { color: #00d4ff; }

.nav-actions { display: flex; align-items: center; gap: 12px; }

.btn-search {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid #25262a; border-radius: 6px;
  color: #6e737a; cursor: pointer; transition: all 0.2s;
}

.btn-search:hover { border-color: #00d4ff; color: #00d4ff; }

.btn-write {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 16px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #0a0a0c; background: #00d4ff; border-radius: 6px;
  text-decoration: none; transition: all 0.2s;
}

.btn-write:hover {
  background: #00b8d4;
  box-shadow: 0 0 20px rgba(0,212,255,0.25);
  transform: translateY(-1px);
}

.btn-write-icon { font-size: 15px; font-weight: 700; }

/* ====== 状态 ====== */
.state-box {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 96px 20px; font-size: 13px; color: #484b52;
}

.state-box.error {
  color: #ff5f57; flex-direction: column; gap: 12px;
}

.err-prefix { font-weight: 700; letter-spacing: 1px; font-size: 12px; }
.state-text { color: inherit; }

.link-btn {
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #00d4ff; text-decoration: none; transition: color 0.2s;
}

.link-btn:hover { color: #00b8d4; }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid #1c1d21;
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ====== 封面 ====== */
.cover-wrap {
  position: relative; z-index: 1;
  border-bottom: 1px solid #1c1d21;
}

.cover-img {
  width: 100%; max-height: 420px; object-fit: cover;
  display: block;
}

/* ====== 文章容器 ====== */
.post-article {
  position: relative; z-index: 1;
  max-width: 720px; margin: 0 auto; padding: 56px 24px 32px;
}

.post-meta-top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }

.post-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: #00d4ff;
}

.post-badge {
  font-size: 9px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: #2bd64e;
  padding: 2px 8px; border: 1px solid rgba(43,214,78,0.3);
  border-radius: 3px;
}

.post-title {
  font-size: 34px; font-weight: 800; line-height: 1.3;
  color: #e6edf3; margin: 0 0 20px; letter-spacing: -0.5px;
}

.post-meta-line {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin-bottom: 40px; padding-bottom: 24px;
  border-bottom: 1px solid #1c1d21;
}

.post-author-link {
  display: flex; align-items: center; gap: 8px;
  text-decoration: none; transition: opacity 0.2s;
}

.post-author-link:hover { opacity: 0.8; }

.author-avatar-sm {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,212,255,0.1); color: #00d4ff;
  border-radius: 6px; font-size: 12px; font-weight: 700;
  text-transform: uppercase;
}

.author-name { font-size: 13px; font-weight: 600; color: #8b9098; }

.meta-sep { width: 1px; height: 12px; background: #1c1d21; }
.meta-item { font-size: 11px; color: #484b52; }

/* ====== Markdown 正文 ====== */
.post-content {
  font-size: 15px; line-height: 1.85; color: #c9d1d9;
}

/* markdown 元素样式 — 终端主题定制 */
.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
  color: #e6edf3; font-weight: 700; margin: 32px 0 12px;
}

.post-content :deep(h1) { font-size: 26px; }
.post-content :deep(h2) { font-size: 20px; }
.post-content :deep(h3) { font-size: 16px; }

.post-content :deep(p) { margin: 0 0 16px; }

.post-content :deep(a) {
  color: #00d4ff; text-decoration: underline;
  text-underline-offset: 3px;
}

.post-content :deep(a:hover) { color: #00b8d4; }

.post-content :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px; padding: 2px 6px;
  background: rgba(255,255,255,0.05); border: 1px solid #1c1d21;
  border-radius: 4px; color: #00d4ff;
}

.post-content :deep(pre) {
  background: #0f1013; border: 1px solid #1c1d21;
  border-radius: 8px; padding: 16px 20px;
  overflow-x: auto; margin: 20px 0;
}

.post-content :deep(pre code) {
  background: none; border: none; padding: 0; color: #c9d1d9;
}

.post-content :deep(blockquote) {
  border-left: 2px solid #00d4ff; margin: 16px 0;
  padding: 8px 16px; color: #6e737a; font-style: italic;
}

.post-content :deep(img) {
  max-width: 100%; border-radius: 8px;
  border: 1px solid #1c1d21; margin: 16px 0;
}

.post-content :deep(ul),
.post-content :deep(ol) {
  padding-left: 24px; margin: 12px 0;
}

.post-content :deep(li) { margin: 6px 0; }

.post-content :deep(hr) {
  border: none; border-top: 1px solid #1c1d21; margin: 32px 0;
}

.post-content :deep(table) {
  width: 100%; border-collapse: collapse;
  font-size: 13px; margin: 16px 0;
}

.post-content :deep(th),
.post-content :deep(td) {
  border: 1px solid #1c1d21; padding: 8px 12px; text-align: left;
}

.post-content :deep(th) {
  background: #0f1013; color: #8b9098; font-weight: 600;
}

/* ====== 文章底部操作 ====== */
.post-actions {
  display: flex; align-items: center; gap: 16px;
  margin-top: 48px; padding-top: 24px;
  border-top: 1px solid #1c1d21;
}

.btn-edit {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 20px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #0a0a0c; background: #00d4ff; border-radius: 6px;
  text-decoration: none; transition: all 0.2s;
}

.btn-edit:hover {
  background: #00b8d4;
  box-shadow: 0 0 20px rgba(0,212,255,0.25);
}

.btn-delete {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 20px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #ff5f57; background: rgba(255,95,87,0.06);
  border: 1px solid rgba(255,95,87,0.2); border-radius: 6px;
  cursor: pointer; transition: all 0.2s;
}
.btn-delete:hover { background: rgba(255,95,87,0.12); border-color: #ff5f57; }

.btn-back {
  display: flex; align-items: center; gap: 6px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #6e737a; text-decoration: none; transition: color 0.2s;
}

.btn-back:hover { color: #00d4ff; }

.btn-icon { font-size: 14px; }

/* ====== 作者卡片 ====== */
.author-card {
  position: relative; z-index: 1;
  max-width: 720px; margin: 0 auto 64px; padding: 0 24px;
}

.author-card-inner {
  display: flex; align-items: center; gap: 16px;
  padding: 20px; background: #0f1013;
  border: 1px solid #1c1d21; border-radius: 10px;
  text-decoration: none; transition: border-color 0.2s;
}

.author-card-inner:hover { border-color: #00d4ff; }

.author-avatar-md {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.05) 100%);
  border: 1px solid rgba(0,212,255,0.2);
  border-radius: 10px; font-size: 20px; font-weight: 800;
  color: #00d4ff; text-transform: uppercase;
  flex-shrink: 0;
}

.author-card-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }

.author-card-name { font-size: 14px; font-weight: 700; color: #c9d1d9; }

.author-card-nick { font-size: 12px; color: #6e737a; }

.author-card-bio { font-size: 11px; color: #484b52; }

.author-card-arrow { font-size: 16px; color: #484b52; font-weight: 700; }

/* ====== Footer ====== */
.footer {
  position: relative; z-index: 1;
  border-top: 1px solid #1c1d21; padding: 24px; text-align: center;
}

.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.footer-prompt { color: #00d4ff; }
.footer-cmd { color: #484b52; }

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .nav-links { display: none; }
  .post-title { font-size: 24px; }
  .post-article { padding: 40px 20px 24px; }
}
</style>
