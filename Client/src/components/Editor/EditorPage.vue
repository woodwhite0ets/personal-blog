<template>
  <div class="editor-page">
    <div class="bg-grid"></div>

    <!-- ====== Toast 提示 ====== -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '✗' }}</span>
        {{ toast.message }}
      </div>
    </Transition>

    <!-- ====== 导航栏 ====== -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/editor</span>
        </router-link>
        <div class="nav-actions">
          <span v-if="autoSaveLabel" class="auto-save-hint">{{ autoSaveLabel }}</span>
          <span class="draft-indicator" :class="{ published: form.status === 'published' }">
            <span class="indicator-dot"></span>
            {{ form.status === 'published' ? 'PUBLISHED' : 'DRAFT' }}
          </span>
          <button class="btn-action btn-draft" @click="saveDraft" :disabled="saving || !saveReady">
            <span class="btn-icon">💾</span> draft
            <span class="btn-shortcut">Ctrl+S</span>
          </button>
          <button class="btn-action btn-publish" @click="publish" :disabled="saving || !saveReady">
            <span class="btn-icon">🚀</span> publish
            <span class="btn-shortcut">Ctrl+Shift+P</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ====== 编辑器主体 ====== -->
    <div class="editor-main">
      <!-- 左侧：编辑区 -->
      <div class="editor-pane">
        <!-- 标题 -->
        <input
          ref="titleInput"
          v-model="form.title"
          type="text"
          class="input-title"
          placeholder="post title..."
          :class="{ error: errors.title }"
        />
        <span v-if="errors.title" class="field-err">{{ errors.title }}</span>

        <!-- 标签 -->
        <div class="tags-row">
          <span class="label-hint">tags: <span class="tag-count">{{ formTags.length }}/10</span></span>
          <div class="tags-input-wrap">
            <span v-for="(t, i) in formTags" :key="i" class="tag-chip">
              #{{ t }}
              <button class="tag-remove" @click="removeTag(i)" title="remove">×</button>
            </span>
            <input
              v-model="tagInput"
              type="text"
              class="input-tag"
              placeholder="add tag..."
              :disabled="formTags.length >= 10"
              @keydown.enter.prevent="addTag"
              @keydown.backspace="handleTagBackspace"
              @keydown="handleTagKeydown"
              @blur="addTag"
            />
          </div>
        </div>

        <!-- 封面图区域 -->
        <div class="cover-section">
          <span class="label-hint">cover:</span>
          <div
            class="cover-dropzone"
            :class="{ hasImage: coverPreview }"
            @click="triggerCoverUpload"
            @dragover.prevent
            @drop.prevent="handleCoverDrop"
          >
            <img v-if="coverPreview" :src="coverPreview" class="cover-preview" />
            <template v-else>
              <span class="dropzone-icon">🖼</span>
              <span class="dropzone-text">drop cover image or click</span>
            </template>
            <input
              ref="coverInput"
              type="file"
              accept="image/*"
              class="file-hidden"
              @change="handleCoverFile"
            />
          </div>
          <button v-if="coverPreview" class="btn-remove-cover" @click="removeCover">remove cover</button>
        </div>

        <!-- 摘要 -->
        <textarea
          v-model="form.excerpt"
          class="input-excerpt"
          placeholder="excerpt (optional — auto-generated from content if empty)..."
          rows="2"
        ></textarea>

        <!-- 正文 — Markdown 编辑 -->
        <textarea
          ref="contentInput"
          v-model="form.content"
          class="input-content"
          placeholder="write markdown here...&#10;&#10;Tip: Ctrl+S to save draft · Ctrl+Shift+P to publish · paste images directly"
          :class="{ error: errors.content }"
          @paste="handleContentPaste"
        ></textarea>
        <span v-if="errors.content" class="field-err">{{ errors.content }}</span>
        <span v-if="serverError" class="field-err server-err">{{ serverError }}</span>

        <!-- 置顶复选框（仅管理员可见） -->
        <label v-if="isAdmin" class="checkbox-row">
          <input v-model="form.is_pinned" type="checkbox" />
          <span class="check-text">--pinned (show in hero)</span>
        </label>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="preview-pane">
        <div class="preview-header">
          <span class="preview-title">preview.md</span>
          <span class="preview-hint">{{ wordCount }} chars · ~{{ readTimePreview }} min read</span>
        </div>
        <div class="preview-scroll">
          <!-- 空状态 -->
          <div v-if="!form.content.trim()" class="preview-empty">
            <span class="preview-empty-icon">📄</span>
            <span>start typing to preview...</span>
          </div>
          <!-- 渲染内容 -->
          <div v-else class="preview-body markdown-body" v-html="previewHtml"></div>
        </div>
      </div>
    </div>

    <!-- ====== 页脚 ====== -->
    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">{{ isEditMode ? 'vim' : 'touch' }} ./posts/{{ formSlug || 'new-post' }}.md</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAuth, getToken } from '../../stores/auth.js'

const route = useRoute()
const router = useRouter()
const { currentUser, isLoggedIn, isAdmin } = useAuth()

const API_BASE = '/api'

// ====== 模式判断 ======
const isEditMode = computed(() => !!route.params.slug)
const editSlug = computed(() => route.params.slug || '')

// ====== 状态 ======
const saving = ref(false)
const saveReady = ref(true)  // 图片上传中禁止保存
const serverError = ref('')
const coverPreview = ref('')
const coverFile = ref(null)
const coverInput = ref(null)
const tagInput = ref('')
const titleInput = ref(null)
const contentInput = ref(null)
const autoSaveLabel = ref('')

// ====== Toast ======
const toast = reactive({ show: false, message: '', type: 'success', timer: null })
function showToast(message, type = 'success') {
  clearTimeout(toast.timer)
  toast.message = message
  toast.type = type
  toast.show = true
  toast.timer = setTimeout(() => { toast.show = false }, 3000)
}

// ====== 头像上传 ======
const avatarPreview = ref('')
const avatarFile = ref(null)
const avatarInput = ref(null)

const avatarChar = computed(() => {
  if (currentUser.value?.nickname) return currentUser.value.nickname.charAt(0).toUpperCase()
  if (currentUser.value?.username) return currentUser.value.username.charAt(0).toUpperCase()
  return '?'
})

const form = reactive({
  title: '',
  excerpt: '',
  content: '',
  is_pinned: false,
  status: 'draft',
})

const formSlug = ref('')
const formTags = ref([])
const errors = reactive({ title: '', content: '' })

// ====== 脏数据追踪 ======
const originalForm = ref(null)
const isDirty = computed(() => {
  if (!originalForm.value) return false
  return (
    form.title !== originalForm.value.title ||
    form.content !== originalForm.value.content ||
    form.excerpt !== originalForm.value.excerpt ||
    form.status !== originalForm.value.status ||
    JSON.stringify(formTags.value) !== JSON.stringify(originalForm.value.tags) ||
    coverFile.value !== null
  )
})

function snapshot() {
  originalForm.value = {
    title: form.title,
    content: form.content,
    excerpt: form.excerpt,
    status: form.status,
    tags: [...formTags.value],
  }
}

// ====== 预览（XSS 消毒） ======
const previewHtml = computed(() => {
  if (!form.content.trim()) return ''
  const raw = marked(form.content)
  return DOMPurify.sanitize(raw)
})

const wordCount = computed(() => {
  if (!form.content) return 0
  return form.content.replace(/\s/g, '').length
})

const readTimePreview = computed(() => Math.max(1, Math.ceil(wordCount.value / 400)))

// ====== 标签操作 ======
function addTag() {
  const val = tagInput.value.replace(/,/g, '').trim()
  if (val && !formTags.value.includes(val) && formTags.value.length < 10) {
    formTags.value.push(val)
  }
  tagInput.value = ''
}

function removeTag(index) {
  formTags.value.splice(index, 1)
}

function handleTagBackspace() {
  if (!tagInput.value && formTags.value.length) {
    formTags.value.pop()
  }
}

function handleTagKeydown(e) {
  // 逗号自动添加 tag
  if (e.key === ',') {
    e.preventDefault()
    addTag()
  }
  // 回车也添加 tag
  if (e.key === 'Enter') {
    e.preventDefault()
    addTag()
  }
}

// ====== 封面图 ======
function triggerCoverUpload() {
  coverInput.value?.click()
}

function handleCoverFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  readCoverFile(file)
}

function handleCoverDrop(e) {
  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  readCoverFile(file)
}

function readCoverFile(file) {
  coverFile.value = file
  const reader = new FileReader()
  reader.onload = () => { coverPreview.value = reader.result }
  reader.readAsDataURL(file)
}

function removeCover() {
  coverFile.value = null
  coverPreview.value = ''
  if (coverInput.value) coverInput.value.value = ''
}

// ====== 头像操作 ======
function triggerAvatarUpload() {
  avatarInput.value?.click()
}

function handleAvatarFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  avatarFile.value = file
  const reader = new FileReader()
  reader.onload = () => { avatarPreview.value = reader.result }
  reader.readAsDataURL(file)
}

// ====== 图片粘贴 ======
const uploadingImages = ref(0)  // 正在上传的图片计数

function handleContentPaste(e) {
  const items = e.clipboardData?.items
  if (!items || items.length === 0) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (!file) continue

      uploadingImages.value++
      saveReady.value = false

      // 上传图片并插入 Markdown 语法
      const reader = new FileReader()
      reader.onload = () => {
        // 先在预览中显示 base64（临时）
        const placeholder = `![uploading...](data:${item.type};base64,${reader.result.split(',')[1]})`
        insertAtCursor(contentInput.value, `\n${placeholder}\n`)
      }
      reader.readAsDataURL(file)

      // 异步上传
      uploadInlineImage(file)
      break // 一次只处理一张
    }
  }
}

async function uploadInlineImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', 'content')
  fd.append('slug', formSlug.value)

  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    if (!res.ok) throw new Error('upload failed')
    const data = await res.json()
    // 替换临时占位符为真实 URL
    form.content = form.content.replace(
      /!\[uploading\.\.\.\]\(data:image\/[^)]+\)/,
      `![image](${data.url})`
    )
  } catch {
    // 移除失败的占位符
    form.content = form.content.replace(
      /!\[uploading\.\.\.\]\(data:image\/[^)]+\)\n?/g,
      ''
    )
    showToast('image upload failed', 'error')
  } finally {
    uploadingImages.value--
    if (uploadingImages.value <= 0) {
      uploadingImages.value = 0
      saveReady.value = true
    }
  }
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = textarea.value.substring(0, start)
  const after = textarea.value.substring(end)
  // 使用 nextTick 避免与 v-model 冲突
  requestAnimationFrame(() => {
    form.content = before + text + after
    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length
      textarea.focus()
    })
  })
}

// ====== 校验 ======
function validate() {
  let valid = true
  errors.title = ''
  errors.content = ''

  if (!form.title.trim()) {
    errors.title = 'title is required'
    valid = false
  }
  if (!form.content.trim()) {
    errors.content = 'content is required'
    valid = false
  }
  return valid
}

// ====== 上传封面 ======
async function uploadCover(postSlug) {
  if (!coverFile.value) return null

  const fd = new FormData()
  fd.append('file', coverFile.value)
  fd.append('type', 'cover')
  fd.append('slug', postSlug)

  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    if (res.ok) {
      const data = await res.json()
      return data.url
    }
  } catch { /* 上传失败不阻塞保存 */ }
  return null
}

async function uploadAvatar() {
  if (!avatarFile.value) return null
  const fd = new FormData()
  fd.append('file', avatarFile.value)
  fd.append('type', 'avatar')
  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    if (res.ok) {
      const data = await res.json()
      return data.url
    }
  } catch { /* 上传失败不阻塞 */ }
  return null
}

// ====== 保存 / 发布 ======
async function saveDraft() {
  form.status = 'draft'
  await savePost()
}

async function publish() {
  form.status = 'published'
  await savePost()
}

async function savePost() {
  if (!validate()) return
  if (!isLoggedIn.value) {
    router.push('/')
    return
  }

  // 图片上传中，禁止保存
  if (uploadingImages.value > 0) {
    showToast(`${uploadingImages.value} image(s) uploading — please wait`, 'error')
    return
  }

  saving.value = true
  serverError.value = ''

  try {
    const url = isEditMode.value
      ? `${API_BASE}/posts/${editSlug.value}`
      : `${API_BASE}/posts`

    const method = isEditMode.value ? 'PUT' : 'POST'

    const payload = {
      title: form.title.trim(),
      slug: formSlug.value || undefined,
      excerpt: form.excerpt.trim() || form.content.trim().slice(0, 150),
      content: form.content,
      tags: formTags.value,
      is_pinned: form.is_pinned,
      status: form.status,
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    })

    console.log('[editor] save response status:', res.status)
    console.log('[editor] payload tags:', JSON.stringify(payload.tags))

    console.log('[editor] save response status:', res.status)
    console.log('[editor] payload tags:', JSON.stringify(payload.tags))

    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'save failed')

    const savedSlug = data.post?.slug || data.slug || formSlug.value

    // 如果有封面图，上传
    if (coverFile.value && savedSlug) {
      const coverUrl = await uploadCover(savedSlug)
      if (coverUrl) {
        // 更新文章的 cover_image
        await fetch(`${API_BASE}/posts/${savedSlug}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ cover_image: coverUrl }),
        }).catch(() => {})
      }
    }

    // 如果有头像，上传
    await uploadAvatar()

    // 清除本地草稿
    clearDraft()

    // 标记为非脏
    snapshot()
    coverFile.value = null

    showToast(form.status === 'published' ? 'published!' : 'draft saved')
    autoSaveLabel.value = ''

    router.push(`/post/${savedSlug}`)
  } catch (e) {
    serverError.value = e.message || '保存失败'
    showToast(e.message || 'save failed', 'error')
  } finally {
    saving.value = false
  }
}

// ====== 加载已有文章（编辑模式） ======
async function loadPost() {
  if (!isEditMode.value) return

  try {
    const res = await fetch(`${API_BASE}/posts/${editSlug.value}`)
    if (!res.ok) {
      if (res.status === 404) {
        serverError.value = 'post not found'
        return
      }
      throw new Error('load failed')
    }
    const data = await res.json()
    const p = data.post

    if (p.author && currentUser.value && p.author.username !== currentUser.value.username && !isAdmin.value) {
      serverError.value = 'you are not the author'
      return
    }

    form.title = p.title || ''
    form.excerpt = p.excerpt || ''
    form.content = p.content || ''
    form.is_pinned = p.is_pinned || false
    form.status = p.status || 'draft'
    formSlug.value = p.slug || editSlug.value

    // 解析标签
    if (p.tags && Array.isArray(p.tags)) {
      formTags.value = p.tags.map(t => typeof t === 'string' ? t : t.name)
    } else if (p.tag) {
      formTags.value = [p.tag]
    }

    // 封面预览
    if (p.cover_image) {
      coverPreview.value = p.cover_image
    }

    // 创建基线快照
    snapshot()
  } catch (e) {
    serverError.value = e.message || '加载失败'
  }
}

// ====== 自动存草稿（localStorage） ======
const DRAFT_KEY = 'blog_editor_draft'
let autoSaveTimer = null

function saveDraftLocal() {
  if (!form.title.trim() && !form.content.trim()) return
  try {
    const draft = {
      title: form.title,
      content: form.content,
      excerpt: form.excerpt,
      tags: formTags.value.slice(),
      status: 'draft',
      savedAt: Date.now(),
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    autoSaveLabel.value = 'auto-saved'
    setTimeout(() => { autoSaveLabel.value = '' }, 2000)
  } catch { /* storage full */ }
}

function restoreDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const draft = JSON.parse(raw)
    // 只恢复 30 分钟内的草稿
    if (Date.now() - draft.savedAt > 30 * 60 * 1000) {
      sessionStorage.removeItem(DRAFT_KEY)
      return
    }
    form.title = draft.title || ''
    form.content = draft.content || ''
    form.excerpt = draft.excerpt || ''
    if (draft.tags) formTags.value = draft.tags
    form.status = 'draft'
    snapshot()
    return true
  } catch { return false }
}

function clearDraft() {
  sessionStorage.removeItem(DRAFT_KEY)
}

// ====== 键盘快捷键 ======
function handleKeyboard(e) {
  // Ctrl+S / Cmd+S — 保存草稿
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    saveDraft()
    return
  }
  // Ctrl+Shift+P / Cmd+Shift+P — 发布
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
    e.preventDefault()
    publish()
    return
  }
}

// ====== 离开确认（未保存内容） ======
onBeforeRouteLeave((to, from, next) => {
  if (isDirty.value && !saving.value) {
    const leave = window.confirm('you have unsaved changes — leave anyway?')
    if (!leave) return next(false)
  }
  next()
})

function handleBeforeUnload(e) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = '' // Chrome 需要
  }
}

// ====== 生命周期 ======
onMounted(async () => {
  await nextTick()

  if (!isLoggedIn.value) {
    const token = getToken()
    if (!token) {
      router.push('/')
      return
    }
  }

  // 新建模式：尝试恢复草稿
  if (!isEditMode.value) {
    formSlug.value = 'new-' + Date.now().toString(36)
    const restored = restoreDraft()
    if (restored) {
      showToast('draft restored from last session')
    }
  }

  loadPost()

  // 聚焦第一个空字段
  nextTick(() => {
    if (!form.title) titleInput.value?.focus()
    else contentInput.value?.focus()
  })

  // 监听键盘快捷键
  window.addEventListener('keydown', handleKeyboard)
  // 监听关闭/刷新
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  // 离开前保存草稿
  if (isDirty.value && (form.title.trim() || form.content.trim())) {
    saveDraftLocal()
  }
  window.removeEventListener('keydown', handleKeyboard)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 内容变化时自动存草稿（3秒防抖）
watch(
  () => [form.title, form.content, form.excerpt, formTags.value],
  () => {
    if (isEditMode.value) return // 编辑模式不自动存
    clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(saveDraftLocal, 3000)
  },
  { deep: true }
)
</script>

<style scoped>
.editor-page {
  min-height: 100vh;
  background: #0a0a0c;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9;
  position: relative;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

/* ====== Toast ====== */
.toast {
  position: fixed; top: 72px; right: 24px; z-index: 999;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 6px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  box-shadow: 0 4px 24px rgba(0,0,0,0.5);
  pointer-events: none;
}
.toast.success { background: #0f1013; border: 1px solid rgba(43,214,78,0.3); color: #2bd64e; }
.toast.error   { background: #0f1013; border: 1px solid rgba(255,95,87,0.3); color: #ff5f57; }
.toast-icon { font-weight: 800; font-size: 14px; }

.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(16px); }

/* ====== Navbar ====== */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,12,0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid #1c1d21;
}

.navbar-inner {
  max-width: 100%; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; justify-content: space-between;
}

.brand {
  display: flex; align-items: baseline; gap: 4px;
  text-decoration: none; font-size: 14px; font-weight: 600;
}

.brand-bracket { color: #484b52; }
.brand-text { color: #00d4ff; }
.brand-path { color: #6e737a; margin-left: 8px; font-size: 12px; }

.nav-actions { display: flex; align-items: center; gap: 12px; }

.auto-save-hint {
  font-size: 9px; color: #484b52; font-weight: 600;
  letter-spacing: 0.5px; white-space: nowrap;
}

.draft-indicator {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  color: #feba0a; padding: 4px 12px;
  background: rgba(254,186,10,0.08);
  border: 1px solid rgba(254,186,10,0.2);
  border-radius: 4px;
}

.draft-indicator.published {
  color: #2bd64e;
  background: rgba(43,214,78,0.08);
  border-color: rgba(43,214,78,0.2);
}

.indicator-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.btn-action {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 18px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  border-radius: 6px; cursor: pointer; transition: all 0.2s;
  border: 1px solid transparent;
}

.btn-action:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-draft {
  color: #8b9098; background: rgba(255,255,255,0.04);
  border-color: #25262a;
}

.btn-draft:hover:not(:disabled) {
  border-color: #6e737a; color: #c9d1d9;
}

.btn-publish {
  color: #0a0a0c; background: #00d4ff;
}

.btn-publish:hover:not(:disabled) {
  background: #00b8d4;
  box-shadow: 0 0 20px rgba(0,212,255,0.25);
  transform: translateY(-1px);
}

.btn-icon { font-size: 12px; }

.btn-shortcut {
  font-size: 9px; opacity: 0.45; letter-spacing: 0.5px;
  margin-left: 2px;
}

/* ====== 主编辑区 ====== */
.editor-main {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: 1fr 1fr;
  min-height: calc(100vh - 56px - 57px);
}

/* ====== 编辑面板 ====== */
.editor-pane {
  padding: 32px 28px;
  border-right: 1px solid #1c1d21;
  display: flex; flex-direction: column; gap: 20px;
  overflow-y: auto;
}

.input-title {
  width: 100%; padding: 14px 0;
  font-family: inherit; font-size: 24px; font-weight: 800;
  color: #e6edf3; background: none; border: none;
  border-bottom: 1px solid #1c1d21;
  outline: none; caret-color: #00d4ff;
  letter-spacing: -0.5px;
}

.input-title::placeholder { color: #33363c; }

.input-title.error { border-bottom-color: #ff5f57; }

.label-hint {
  font-size: 10px; font-weight: 600; color: #484b52;
  text-transform: uppercase; letter-spacing: 1.5px;
  margin-bottom: -14px;
  display: flex; align-items: center; gap: 6px;
}

.tag-count {
  font-size: 9px; color: #33363c; font-weight: 400;
}

/* 标签输入 */
.tags-row { display: flex; flex-direction: column; gap: 8px; }

.tags-input-wrap {
  display: flex; flex-wrap: wrap; gap: 6px;
  align-items: center; padding: 8px 12px;
  background: #0f1013; border: 1px solid #25262a;
  border-radius: 6px; min-height: 42px;
  transition: border-color 0.2s;
}

.tags-input-wrap:focus-within { border-color: #00d4ff; }

.tag-chip {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; padding: 3px 8px;
  background: rgba(0,212,255,0.08); color: #00d4ff;
  border: 1px solid rgba(0,212,255,0.2);
  border-radius: 4px; font-weight: 600;
}

.tag-remove {
  font-family: inherit; font-size: 13px; font-weight: 700;
  color: #00d4ff; background: none; border: none;
  cursor: pointer; padding: 0; line-height: 1;
  opacity: 0.6; transition: opacity 0.2s;
}

.tag-remove:hover { opacity: 1; }

.input-tag {
  flex: 1; min-width: 100px;
  font-family: inherit; font-size: 13px;
  color: #c9d1d9; background: none; border: none;
  outline: none; caret-color: #00d4ff;
}

.input-tag::placeholder { color: #33363c; }

.input-tag:disabled { opacity: 0.4; cursor: not-allowed; }

/* 封面上传 */
.cover-section { display: flex; flex-direction: column; gap: 8px; }

/* ====== 头像上传 ====== */
.avatar-section { display: flex; flex-direction: column; gap: 8px; }

.avatar-upload-row {
  display: flex; align-items: center; gap: 16px;
  padding: 12px; background: #0f1013;
  border: 1px solid #25262a; border-radius: 8px;
  cursor: pointer; transition: border-color 0.2s;
}

.avatar-upload-row:hover { border-color: #00d4ff; }

.avatar-preview-sm {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(0,212,255,0.05) 100%);
  border: 2px solid rgba(0,212,255,0.25);
  border-radius: 8px; overflow: hidden; flex-shrink: 0;
}

.avatar-img {
  width: 100%; height: 100%; object-fit: cover;
}

.avatar-char {
  font-size: 20px; font-weight: 800; color: #00d4ff; text-transform: uppercase;
}

.avatar-actions { flex: 1; }

.avatar-hint {
  font-size: 11px; color: #484b52; letter-spacing: 0.5px;
}

.cover-dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 28px;
  background: #0f1013; border: 2px dashed #1c1d21;
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}

.cover-dropzone:hover { border-color: #00d4ff; background: rgba(0,212,255,0.02); }

.cover-dropzone.hasImage { padding: 0; border-style: solid; }

.cover-preview {
  width: 100%; max-height: 180px; object-fit: cover;
  border-radius: 6px;
}

.dropzone-icon { font-size: 28px; opacity: 0.5; }
.dropzone-text { font-size: 12px; color: #484b52; }

.file-hidden { display: none; }

.btn-remove-cover {
  align-self: flex-start;
  font-family: inherit; font-size: 11px; font-weight: 600;
  color: #ff5f57; background: none; border: none;
  cursor: pointer; transition: color 0.2s;
}

.btn-remove-cover:hover { color: #ff7570; }

/* 摘要 */
.input-excerpt {
  width: 100%; padding: 12px 14px;
  font-family: inherit; font-size: 13px; color: #c9d1d9;
  background: #0f1013; border: 1px solid #25262a;
  border-radius: 6px; outline: none; resize: none;
  caret-color: #00d4ff; transition: border-color 0.2s;
}

.input-excerpt:focus { border-color: #00d4ff; }
.input-excerpt::placeholder { color: #33363c; }

/* 正文编辑 */
.input-content {
  flex: 1; min-height: 300px; width: 100%;
  padding: 14px; font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 14px; line-height: 1.75; color: #c9d1d9;
  background: #0f1013; border: 1px solid #25262a;
  border-radius: 8px; outline: none; resize: vertical;
  caret-color: #00d4ff; transition: border-color 0.2s;
}

.input-content:focus { border-color: #00d4ff; }
.input-content::placeholder { color: #33363c; }
.input-content.error { border-color: #ff5f57; }

.field-err {
  font-size: 11px; color: #ff5f57;
  display: flex; align-items: center; gap: 4px;
}

.field-err::before { content: 'ERR!'; font-weight: 700; letter-spacing: 1px; }

.server-err {
  margin-top: 4px; padding: 8px 12px;
  background: rgba(255,95,87,0.06);
  border: 1px solid rgba(255,95,87,0.15);
  border-radius: 4px;
}
.server-err::before { display: none; }

/* 复选框 */
.checkbox-row {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
}

.checkbox-row input[type='checkbox'] { accent-color: #00d4ff; width: 15px; height: 15px; }

.check-text { font-size: 12px; color: #6e737a; }

/* ====== 预览面板 ====== */
.preview-pane {
  display: flex; flex-direction: column;
  background: #0c0c0e;
  overflow: hidden;
}

.preview-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255,255,255,0.01);
  border-bottom: 1px solid #1c1d21;
}

.preview-title {
  font-size: 11px; font-weight: 600; color: #484b52;
  letter-spacing: 1px;
}

.preview-hint { font-size: 10px; color: #33363c; }

.preview-scroll {
  flex: 1; overflow-y: auto; padding: 32px 36px;
}

.preview-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 80px 20px;
  font-size: 13px; color: #484b52;
}

.preview-empty-icon { font-size: 36px; opacity: 0.3; }

/* 预览 Markdown 样式 — 复用 PostDetail */
.preview-body { font-size: 15px; line-height: 1.85; }

.preview-body :deep(h1),
.preview-body :deep(h2),
.preview-body :deep(h3) {
  color: #e6edf3; font-weight: 700; margin: 28px 0 10px;
}

.preview-body :deep(h1) { font-size: 24px; }
.preview-body :deep(h2) { font-size: 19px; }
.preview-body :deep(h3) { font-size: 15px; }

.preview-body :deep(p) { margin: 0 0 14px; }

.preview-body :deep(a) {
  color: #00d4ff; text-decoration: underline;
  text-underline-offset: 3px;
}

.preview-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px; padding: 2px 6px;
  background: rgba(255,255,255,0.05); border: 1px solid #1c1d21;
  border-radius: 4px; color: #00d4ff;
}

.preview-body :deep(pre) {
  background: #0f1013; border: 1px solid #1c1d21;
  border-radius: 8px; padding: 16px 20px; overflow-x: auto; margin: 18px 0;
}

.preview-body :deep(pre code) {
  background: none; border: none; padding: 0; color: #c9d1d9;
}

.preview-body :deep(blockquote) {
  border-left: 2px solid #00d4ff; margin: 14px 0;
  padding: 6px 14px; color: #6e737a; font-style: italic;
}

.preview-body :deep(img) {
  max-width: 100%; border-radius: 8px;
  border: 1px solid #1c1d21; margin: 14px 0;
}

.preview-body :deep(ul),
.preview-body :deep(ol) { padding-left: 22px; margin: 10px 0; }
.preview-body :deep(li) { margin: 5px 0; }
.preview-body :deep(hr) { border: none; border-top: 1px solid #1c1d21; margin: 28px 0; }

/* ====== Footer ====== */
.footer {
  position: relative; z-index: 1;
  border-top: 1px solid #1c1d21; padding: 20px 24px; text-align: center;
}

.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.footer-prompt { color: #00d4ff; }
.footer-cmd { color: #484b52; }

/* ====== 响应式 ====== */
@media (max-width: 900px) {
  .editor-main { grid-template-columns: 1fr; }
  .editor-pane { border-right: none; border-bottom: 1px solid #1c1d21; }
  .preview-pane { max-height: 50vh; }
  .input-title { font-size: 20px; }
  .btn-shortcut { display: none; }
}
</style>
