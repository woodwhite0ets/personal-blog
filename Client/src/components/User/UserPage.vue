<template>
  <div class="user-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <!-- ====== 导航栏 ====== -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/user</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/HomePage">
            <span class="nav-num">01</span> 首页
          </router-link>
          <router-link to="/archive">
            <span class="nav-num">02</span> 归档
          </router-link>
          <router-link to="/about">
            <span class="nav-num">03</span> 关于
          </router-link>
        </nav>
        <div class="nav-actions">
          <ThemeSwitcher />
          <router-link v-if="isLoggedIn" to="/editor" class="btn-write">
            <span class="btn-write-icon">+</span> 新文章
          </router-link>
        </div>
      </div>
    </header>

    <!-- ====== 用户资料头 ====== -->
    <section class="user-hero">
      <div class="user-hero-inner">
        <div class="avatar-wrap" :class="{ 'avatar-editable': isOwnPage }" @click="isOwnPage && triggerAvatarUpload()">
          <UserAvatar :src="profile?.avatar" :alt="(profile?.nickname || username)" size="xl" />
          <span v-if="isOwnPage" class="avatar-edit-overlay" :class="{ uploading: avatarUploading }">
            {{ avatarUploading ? '...' : '✎' }}
          </span>
        </div>
        <input
          ref="avatarInput"
          type="file"
          accept="image/*"
          hidden
          @change="handleAvatarFile"
        />
        <div class="user-info">
          <div class="user-name-line">
            <span class="user-at">@{{ username }}</span>
            <span v-if="profile?.nickname" class="user-nickname">{{ profile.nickname }}</span>
          </div>
          <p v-if="profile?.bio" class="user-bio">{{ profile.bio }}</p>
          <div class="user-stats">
            <div class="stat">
              <span class="stat-value">{{ totalPosts }}</span>
              <span class="stat-label">文章</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile?.role || '作者' }}</span>
              <span class="stat-label">角色</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatDate(profile?.created_at) }}</span>
              <span class="stat-label">加入</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====== 主体 ====== -->
    <div class="main-layout">
      <PostList
        :posts="posts"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMore"
        :empty-text="`@${username} 还没有发布文章。`"
        @load-more="loadMore"
        @refresh="fetchPosts"
      />

      <aside class="sidebar">
        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">user.info</span>
          </div>
          <div class="panel-body">
            <div class="info-line">
              <span class="info-key">id</span>
              <span class="info-val">uid_{{ profile?.id || '—' }}</span>
            </div>
            <div class="info-line">
              <span class="info-key">email</span>
              <span class="info-val">{{ profile?.email || '—' }}</span>
            </div>
            <div class="info-line">
              <span class="info-key">status</span>
              <span class="info-val terminal-green">正常</span>
            </div>
          </div>
        </div>

        <!-- 编辑资料 + 草稿（仅本人可见） -->
        <div v-if="isOwnPage" class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">account</span>
          </div>
          <div class="panel-body">
            <button class="btn-change-pwd" @click="openProfileModal">编辑资料</button>
            <button class="btn-change-pwd" @click="toggleDrafts">
              我的草稿
              <span v-if="draftCount > 0" class="draft-count">{{ draftCount }}</span>
            </button>
          </div>
        </div>

        <!-- 草稿列表 -->
        <div v-if="isOwnPage && showDrafts" class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-yellow"></span>
            <span class="panel-dot dot-yellow dim"></span>
            <span class="panel-title">drafts ({{ draftCount }})</span>
          </div>
          <div class="panel-body">
            <div v-if="drafts.length === 0" class="no-drafts">— 暂无草稿</div>
            <div v-for="d in drafts" :key="d.id" class="draft-item">
              <router-link :to="`/editor/${d.slug}`" class="draft-link">{{ d.title || '未命名' }}</router-link>
              <span class="draft-date">{{ formatDate(d.published_at || d.created_at) }}</span>
            </div>
          </div>
        </div>

        <!-- 修改密码（仅本人可见） -->
        <div v-if="isOwnPage" class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-green"></span>
            <span class="panel-dot dot-green dim"></span>
            <span class="panel-title">security.pwd</span>
          </div>
          <div class="panel-body">
            <button class="btn-change-pwd" @click="openPwdModal">修改密码</button>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-yellow"></span>
            <span class="panel-dot dot-yellow dim"></span>
            <span class="panel-title">tags.used</span>
          </div>
          <div class="panel-body">
            <div class="tag-cloud">
              <router-link
                v-for="tag in userTags"
                :key="tag.name"
                :to="`/HomePage?tag=${encodeURIComponent(tag.name)}`"
                class="tag" :class="tag.size"
              >
                #{{ tag.name }}
              </router-link>
              <span v-if="!userTags.length" class="no-tags">— 暂无标签</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- ====== 页脚 ====== -->
    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">finger @{{ username }}</span>
      </div>
    </footer>

    <!-- ====== 修改密码弹窗 ====== -->
    <Transition name="modal">
      <div v-if="showPwdModal" class="modal-overlay" @click.self="showPwdModal = false">
        <div class="pwd-modal">
          <div class="pwd-modal-bar">
            <span class="panel-dot dot-green"></span>
            <span class="panel-dot dot-green dim"></span>
            <span class="panel-title">passwd</span>
            <button class="pwd-modal-close" @click="showPwdModal = false">×</button>
          </div>
          <div class="pwd-modal-body">
            <template v-if="pwdDone">
              <div class="pwd-done">
                <span class="pwd-done-icon">✓</span>
                <span>密码已修改</span>
              </div>
            </template>
            <template v-else>
              <div class="pwd-field">
                <label>当前密码</label>
                <input v-model="pwdForm.oldPassword" type="password" placeholder="••••••••" />
              </div>
              <div class="pwd-field">
                <label>新密码</label>
                <input v-model="pwdForm.newPassword" type="password" placeholder="至少 8 位，需包含字母和数字" />
              </div>
              <div class="pwd-field">
                <label>确认新密码</label>
                <input v-model="pwdForm.confirm" type="password" placeholder="再次输入" />
              </div>
              <span v-if="pwdError" class="pwd-err">{{ pwdError }}</span>
              <button class="pwd-submit" @click="handleChangePwd" :disabled="pwdSaving">
                {{ pwdSaving ? '保存中...' : '更新密码' }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ====== 编辑资料弹窗 ====== -->
    <Transition name="modal">
      <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
        <div class="pwd-modal">
          <div class="pwd-modal-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">edit profile</span>
            <button class="pwd-modal-close" @click="showProfileModal = false">×</button>
          </div>
          <div class="pwd-modal-body">
            <template v-if="profileDone">
              <div class="pwd-done">
                <span class="pwd-done-icon">✓</span>
                <span>{{ profileMsg }}</span>
              </div>
            </template>
            <template v-else>
              <div class="pwd-field">
                <label>昵称</label>
                <input v-model="profileForm.nickname" type="text" placeholder="显示名称" maxlength="50" />
              </div>
              <div class="pwd-field">
                <label>简介</label>
                <textarea v-model="profileForm.bio" rows="3" placeholder="简短介绍（最多 500 字）" maxlength="500"></textarea>
              </div>
              <div class="pwd-field">
                <label>邮箱</label>
                <input v-model="profileForm.email" type="email" placeholder="you@example.com" />
                <span class="pwd-hint">// 修改邮箱需要重新验证</span>
              </div>
              <span v-if="profileError" class="pwd-err">{{ profileError }}</span>
              <button class="pwd-submit" @click="handleSaveProfile" :disabled="profileSaving">
                {{ profileSaving ? '保存中...' : '保存资料' }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PostList from '../Homepage/PostList.vue'
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
import UserAvatar from '../common/UserAvatar.vue'
import { useAuth, getToken } from '../../stores/auth.js'

const route = useRoute()
const { currentUser, isLoggedIn, fetchMe } = useAuth()

const API_BASE = '/api'

// ====== 修改密码弹窗 ======
const showPwdModal = ref(false)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirm: '' })
const pwdError = ref('')
const pwdSaving = ref(false)
const pwdDone = ref(false)

const isOwnPage = computed(() => {
  return currentUser.value && currentUser.value.username === username.value
})

function openPwdModal() {
  pwdForm.value = { oldPassword: '', newPassword: '', confirm: '' }
  pwdError.value = ''
  pwdDone.value = false
  showPwdModal.value = true
}

// ====== 编辑资料弹窗 ======
const showProfileModal = ref(false)
const profileForm = ref({ nickname: '', bio: '', email: '' })
const profileError = ref('')
const profileSaving = ref(false)
const profileDone = ref(false)
const profileMsg = ref('')

function openProfileModal() {
  profileForm.value = {
    nickname: profile.value?.nickname || '',
    bio: profile.value?.bio || '',
    email: profile.value?.email || '',
  }
  profileError.value = ''
  profileDone.value = false
  showProfileModal.value = true
}

async function handleSaveProfile() {
  profileError.value = ''
  if (!profileForm.value.nickname.trim()) {
    profileError.value = '昵称不能为空'
    return
  }
  profileSaving.value = true
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        nickname: profileForm.value.nickname.trim(),
        bio: profileForm.value.bio,
        email: profileForm.value.email,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '更新失败')

    profileDone.value = true
    profileMsg.value = data.emailChanged
      ? '资料已更新 — 请验证新邮箱'
      : '资料已更新'
    // 刷新用户数据
    await fetchMe()
    await fetchProfile()
  } catch (e) {
    profileError.value = e.message
  } finally {
    profileSaving.value = false
  }
}

// ====== 我的草稿 ======
const showDrafts = ref(false)
const drafts = ref([])
const draftCount = computed(() => drafts.value.length)

async function toggleDrafts() {
  showDrafts.value = !showDrafts.value
  if (showDrafts.value && drafts.value.length === 0) {
    await fetchDrafts()
  }
}

async function fetchDrafts() {
  try {
    const res = await fetch(`${API_BASE}/posts?status=draft`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
    if (res.ok) {
      const data = await res.json()
      drafts.value = data.posts || []
    }
  } catch { /* ignore */ }
}

// ====== 头像上传 ======
const avatarUploading = ref(false)
const avatarInput = ref(null)

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function handleAvatarFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  avatarUploading.value = true
  try {
    const fd = new FormData()
    // 注意: type 必须先于 file 追加, 否则 multer destination 回调中 req.body 尚未解析完 type
    fd.append('type', 'avatar')
    fd.append('file', file)
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    if (res.ok) {
      const data = await res.json()
      await fetch(`${API_BASE}/auth/avatar`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: data.url }),
      })
      await fetchMe()
      await fetchProfile()
    }
  } catch { /* ignore */ }
  avatarUploading.value = false
  // 清空 input 以支持重复上传同一文件
  if (avatarInput.value) avatarInput.value.value = ''
}

async function handleChangePwd() {
  pwdError.value = ''
  pwdDone.value = false

  if (!pwdForm.value.oldPassword) {
    pwdError.value = '请输入当前密码'
    return
  }
  if (pwdForm.value.newPassword.length < 8) {
    pwdError.value = '新密码至少 8 位'
    return
  }
  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(pwdForm.value.newPassword)) {
    pwdError.value = '新密码需包含字母和数字'
    return
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirm) {
    pwdError.value = '两次输入不一致'
    return
  }

  pwdSaving.value = true
  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        oldPassword: pwdForm.value.oldPassword,
        newPassword: pwdForm.value.newPassword,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '修改失败')
    pwdDone.value = true
    setTimeout(() => { showPwdModal.value = false }, 1500)
  } catch (e) {
    pwdError.value = e.message
  } finally {
    pwdSaving.value = false
  }
}

// ====== 用户数据 ======
const profile = ref(null)
const posts = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const currentPage = ref(1)
const totalPages = ref(1)

const username = computed(() => route.params.username)
const hasMore = computed(() => currentPage.value < totalPages.value)
const totalPosts = computed(() => profile.value?.post_count ?? posts.value.length)

// ====== 从文章聚合标签 ======
const userTags = computed(() => {
  const tagMap = {}
  posts.value.forEach(p => {
    const t = p.tag
    if (t) tagMap[t] = (tagMap[t] || 0) + 1
  })
  return Object.entries(tagMap)
    .map(([name, count]) => ({
      name,
      size: count >= 5 ? 'lg' : count >= 3 ? 'md' : count >= 2 ? 'sm' : 'xs',
    }))
    .slice(0, 10)
})

// ====== 获取用户资料 ======
async function fetchProfile() {
  try {
    const res = await fetch(`${API_BASE}/users/${username.value}`)
    if (res.ok) {
      profile.value = (await res.json()).user
    }
  } catch { /* 展示降级 UI */ }
}

// ====== 获取文章 ======
async function fetchPosts(page = 1) {
  if (page === 1) loading.value = true
  error.value = ''

  try {
    const res = await fetch(
      `${API_BASE}/posts?page=${page}&status=published&author=${username.value}`
    )
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '请求失败')

    if (page === 1) {
      posts.value = data.posts
    } else {
      posts.value.push(...data.posts)
    }
    currentPage.value = data.page
    totalPages.value = data.totalPages
  } catch (e) {
    error.value = e.message || '获取文章失败'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  loadingMore.value = true
  await fetchPosts(currentPage.value + 1)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toISOString().split('T')[0]
}

// ====== 生命周期 ======
onMounted(() => {
  fetchProfile()
  fetchPosts()
})

// 路由参数变化时重新加载
watch(username, () => {
  profile.value = null
  posts.value = []
  fetchProfile()
  fetchPosts()
})
</script>

<style scoped>
.user-page {
  min-height: 100vh;
  background: var(--bg);
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: var(--text);
  position: relative;
  overflow-x: hidden;
}

/* 背景 — 复用 Homepage */
.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(var(--overlay-a15) 1px, transparent 1px),
    linear-gradient(90deg, var(--overlay-a15) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

.bg-scanline {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    var(--scanline) 2px, var(--scanline) 4px
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
  background: var(--navbar-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}

.brand {
  display: flex; align-items: baseline; gap: 4px;
  text-decoration: none; font-size: 14px; font-weight: 600;
}

.brand-bracket { color: var(--text-muted); }
.brand-text { color: var(--accent); }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }

.nav-links { display: flex; gap: 28px; flex: 1; }

.nav-links a {
  display: flex; align-items: center; gap: 6px;
  text-decoration: none; font-size: 12px; font-weight: 500;
  color: var(--text-dim); transition: color 0.2s; letter-spacing: 0.5px;
}

.nav-num { color: var(--text-faint); font-size: 10px; font-weight: 700; }

.nav-links a:hover,
.nav-links a.router-link-active { color: var(--text); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }

.nav-actions { display: flex; align-items: center; gap: 12px; }

.btn-search {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--border-strong); border-radius: 6px;
  color: var(--text-dim); cursor: pointer; transition: all 0.2s;
}

.btn-search:hover { border-color: var(--accent); color: var(--accent); }

.btn-write {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 16px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: var(--on-accent); background: var(--accent); border-radius: 6px;
  text-decoration: none; transition: all 0.2s;
}

.btn-write:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 20px var(--accent-a25);
  transform: translateY(-1px);
}

.btn-write-icon { font-size: 15px; font-weight: 700; }

/* ====== Hero ====== */
.user-hero {
  position: relative; z-index: 1;
  border-bottom: 1px solid var(--border);
  background: radial-gradient(ellipse at 50% 0%, var(--accent-a3) 0%, transparent 60%);
}

.user-hero-inner {
  max-width: 1060px; margin: 0 auto; padding: 56px 24px 48px;
  display: flex; align-items: center; gap: 28px;
}

.avatar-wrap {
  position: relative;
  border-radius: 12px;
}
.avatar-wrap.avatar-editable {
  cursor: pointer;
}
.avatar-wrap.avatar-editable:hover {
  opacity: 0.9;
}

.avatar-edit-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4);
  border-radius: 12px;
  color: var(--white);
  font-size: 22px; font-weight: 700;
  opacity: 0; transition: opacity 0.2s;
}
.avatar-wrap.avatar-editable:hover .avatar-edit-overlay,
.avatar-edit-overlay.uploading {
  opacity: 1;
}

.user-avatar-lg {
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--accent-a20) 0%, var(--accent-a5) 100%);
  border: 2px solid var(--accent-a25);
  border-radius: 12px;
  font-size: 36px; font-weight: 800; color: var(--accent);
  text-transform: uppercase;
  flex-shrink: 0;
}

.user-info { display: flex; flex-direction: column; gap: 8px; }

.user-name-line { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }

.user-at { font-size: 22px; font-weight: 800; color: var(--text-bright); letter-spacing: -0.5px; }

.user-nickname {
  font-size: 14px; color: var(--text-dim); font-weight: 500;
}

.user-bio {
  font-size: 13px; color: var(--text-secondary); line-height: 1.6;
  max-width: 520px; margin: 0;
}

.user-stats { display: flex; gap: 28px; margin-top: 4px; }

.stat { display: flex; flex-direction: column; gap: 2px; }

.stat-value {
  font-size: 13px; font-weight: 600; color: var(--text);
}

.stat-label {
  font-size: 10px; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
}

/* ====== 主体 ====== */
.main-layout {
  position: relative; z-index: 1;
  max-width: 1060px; margin: 0 auto; padding: 56px 24px;
  display: grid; grid-template-columns: 1fr 280px; gap: 56px;
}

/* ====== 侧边栏 ====== */
.sidebar { display: flex; flex-direction: column; gap: 20px; }

.sidebar-panel {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}

.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan   { background: var(--accent); }
.dot-yellow { background: var(--warn); }
.dim { opacity: 0.3; }

.panel-title {
  flex: 1; font-size: 10px; font-weight: 600;
  color: var(--text-muted); text-align: center;
  letter-spacing: 1.5px; text-transform: lowercase;
}

.panel-body { padding: 14px 16px; }

.info-line {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 11px;
}

.info-key {
  color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
}

.info-val { color: var(--text-secondary); }
.terminal-green { color: var(--ok); }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; }

.tag {
  font-size: 11px; padding: 4px 10px;
  background: var(--overlay-a3);
  border: 1px solid var(--border); border-radius: 4px;
  color: var(--text-dim); cursor: pointer; transition: all 0.2s;
  text-decoration: none;
}

.tag:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-a4); }
.tag.lg { font-size: 13px; font-weight: 600; }
.tag.md { font-size: 12px; }
.tag.sm { font-size: 11px; }
.tag.xs { font-size: 10px; opacity: 0.7; }

.no-tags { font-size: 11px; color: var(--text-muted); }

/* ====== Footer ====== */
.footer {
  position: relative; z-index: 1;
  border-top: 1px solid var(--border); padding: 24px; text-align: center;
}

.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.footer-prompt { color: var(--accent); }
.footer-cmd { color: var(--text-muted); }

.btn-change-pwd {
  display: block; width: 100%;
  padding: 8px 0;
  font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--ok); background: var(--ok-a6);
  border: 1px solid var(--ok-a20);
  border-radius: 4px; cursor: pointer; transition: all 0.2s;
  text-align: center;
}
.btn-change-pwd:hover {
  background: var(--ok-a12); border-color: var(--ok);
}
.btn-change-pwd + .btn-change-pwd { margin-top: 6px; }
.draft-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px; margin-left: 6px;
  font-size: 10px; font-weight: 700; color: var(--text);
  background: var(--accent-a20); border: 1px solid var(--accent-a30);
  border-radius: 9px;
}
.draft-item {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--border);
}
.draft-item:last-child { border-bottom: none; }
.draft-link {
  font-size: 12px; color: var(--text); text-decoration: none;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.draft-link:hover { color: var(--accent); }
.draft-date { font-size: 10px; color: var(--text-faint); flex-shrink: 0; }
.no-drafts { font-size: 12px; color: var(--text-faint); }

/* 密码弹窗 */
.modal-overlay {
  position: fixed; inset: 0; z-index: 200;
  background: var(--shadow-deep);
  display: flex; align-items: center; justify-content: center;
}
.pwd-modal {
  width: 420px; max-width: 90vw;
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}
.pwd-modal-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}
.pwd-modal-close {
  font-family: inherit; font-size: 18px; font-weight: 700;
  color: var(--text-dim); background: none; border: none;
  cursor: pointer; padding: 0 4px; line-height: 1;
}
.pwd-modal-close:hover { color: var(--err); }
.pwd-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.pwd-field { display: flex; flex-direction: column; gap: 4px; }
.pwd-field label {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1px;
}
.pwd-field input {
  width: 100%; padding: 10px 12px;
  font-family: inherit; font-size: 13px; color: var(--text);
  background: var(--bg); border: 1px solid var(--border-strong); border-radius: 4px;
  outline: none; caret-color: var(--accent);
}
.pwd-field input:focus { border-color: var(--accent); }
.pwd-field textarea {
  width: 100%; padding: 10px 12px;
  font-family: inherit; font-size: 13px; color: var(--text);
  background: var(--bg); border: 1px solid var(--border-strong); border-radius: 4px;
  outline: none; caret-color: var(--accent); resize: vertical;
}
.pwd-field textarea:focus { border-color: var(--accent); }
.pwd-hint { font-size: 10px; color: var(--text-faint); }
.pwd-err {
  font-size: 11px; color: var(--err); display: flex; align-items: center; gap: 4px;
}
.pwd-err::before { content: 'ERR!'; font-weight: 700; letter-spacing: 1px; }
.pwd-submit {
  width: 100%; padding: 10px 0;
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: var(--on-accent); background: var(--ok); border: none;
  border-radius: 4px; cursor: pointer; transition: all 0.2s;
}
.pwd-submit:hover { background: var(--ok-hover); }
.pwd-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.pwd-done {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 24px 0; font-size: 14px; color: var(--ok); font-weight: 600;
}
.pwd-done-icon { font-size: 20px; font-weight: 800; }

.modal-enter-active { transition: all 0.2s ease-out; }
.modal-leave-active { transition: all 0.15s ease-in; }
.modal-enter-from { opacity: 0; }
.modal-enter-from .pwd-modal { transform: scale(0.95); }
.modal-leave-to { opacity: 0; }

.dot-green { background: var(--ok); }

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .main-layout { grid-template-columns: 1fr; gap: 48px; }
  .nav-links { display: none; }
  .user-hero-inner { flex-direction: column; text-align: center; padding: 40px 20px 32px; }
  .user-stats { justify-content: center; }
  .user-avatar-lg { width: 64px; height: 64px; font-size: 28px; }
  .user-at { font-size: 18px; }
}
</style>
