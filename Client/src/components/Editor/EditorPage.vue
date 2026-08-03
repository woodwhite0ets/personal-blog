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
          <ThemeSwitcher />
          <span v-if="autoSaveLabel" class="auto-save-hint">{{ autoSaveLabel }}</span>
          <span class="draft-indicator" :class="{ published: form.status === 'published' }">
            <span class="indicator-dot"></span>
            {{ form.status === 'published' ? '已发布' : '草稿' }}
          </span>
          <button class="btn-action btn-draft" @click="saveDraft" :disabled="saving || !saveReady">
            <span class="btn-icon">💾</span> 存草稿
            <span class="btn-shortcut">Ctrl+S</span>
          </button>
          <button class="btn-action btn-publish" @click="publish" :disabled="saving || !saveReady">
            <span class="btn-icon">🚀</span> 发布
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
          placeholder="文章标题..."
          :class="{ error: errors.title }"
        />
        <span v-if="errors.title" class="field-err">{{ errors.title }}</span>

        <!-- 标签 -->
        <div class="tags-row">
          <span class="label-hint">标签: <span class="tag-count">{{ formTags.length }}/10</span></span>
          <div class="tags-input-wrap">
            <span v-for="(t, i) in formTags" :key="i" class="tag-chip">
              #{{ t }}
              <button class="tag-remove" @click="removeTag(i)" title="移除">×</button>
            </span>
            <input
              v-model="tagInput"
              type="text"
              class="input-tag"
              placeholder="添加标签..."
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
          <span class="label-hint">封面:</span>
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
              <span class="dropzone-text">拖拽封面图或点击上传</span>
            </template>
            <input
              ref="coverInput"
              type="file"
              accept="image/*"
              class="file-hidden"
              @change="handleCoverFile"
            />
          </div>
          <button v-if="coverPreview" class="btn-remove-cover" @click="removeCover">移除封面</button>
        </div>

        <!-- 摘要 -->
        <textarea
          v-model="form.excerpt"
          class="input-excerpt"
          placeholder="摘要（可选 — 留空则自动从正文生成）..."
          rows="2"
        ></textarea>

        <!-- 正文 — Markdown 编辑 -->
        <textarea
          ref="contentInput"
          v-model="form.content"
          class="input-content"
          placeholder="在此编写 Markdown...&#10;&#10;提示: Ctrl+S 保存草稿 · Ctrl+Shift+P 发布 · 可直接粘贴图片"
          :class="{ error: errors.content }"
          @paste="handleContentPaste"
        ></textarea>
        <span v-if="errors.content" class="field-err">{{ errors.content }}</span>
        <span v-if="serverError" class="field-err server-err">{{ serverError }}</span>

        <!-- 置顶复选框（仅管理员可见） -->
        <label v-if="isAdmin" class="checkbox-row">
          <input v-model="form.is_pinned" type="checkbox" />
          <span class="check-text">--pinned（首页推荐位置顶展示）</span>
        </label>
      </div>

      <!-- 右侧：实时预览 -->
      <div class="preview-pane">
        <div class="preview-header">
          <span class="preview-title">preview.md</span>
          <span class="preview-hint">{{ wordCount }} 字符 · 约 {{ readTimePreview }} 分钟阅读</span>
        </div>
        <div class="preview-scroll">
          <!-- 空状态 -->
          <div v-if="!form.content.trim()" class="preview-empty">
            <span class="preview-empty-icon">📄</span>
            <span>开始输入以预览...</span>
          </div>
          <!-- 渲染内容 -->
          <div v-else class="preview-body markdown-body" v-html="previewHtml"></div>
        </div>
      </div>
    </div>

    <SiteFooter :command="(isEditMode ? 'vim' : 'touch') + ' ./posts/' + (formSlug || 'new-post') + '.md'" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useAuth, getToken } from '../../stores/auth.js'
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
import SiteFooter from '../common/SiteFooter.vue'

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
    is_pinned: form.is_pinned,
    tags: [...formTags.value],
  }
}

// ====== 预览（XSS 消毒） ======
const previewHtml = computed(() => {
  if (!form.content.trim()) return ''
  const raw = marked(form.content)
  return DOMPurify.sanitize(raw, {
    FORBID_ATTR: ['style', 'id', 'name'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp):\/\/|\/)/i,
  })
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
  // 客户端预校验：类型 + 大小（最大 10MB，与后端一致）
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showToast('封面必须是 jpg/png/gif/webp 格式', 'error')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('封面过大（最大 10 MB）', 'error')
    return
  }
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

      // 生成唯一 id，避免多图并发时占位符替换错位
      const uid = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)

      // 上传图片并插入 Markdown 语法
      const reader = new FileReader()
      reader.onload = () => {
        // 先在预览中显示 base64（临时），占位符带唯一 id
        const placeholder = `![uploading-${uid}](data:${item.type};base64,${reader.result.split(',')[1]})`
        insertAtCursor(contentInput.value, `\n${placeholder}\n`)
      }
      reader.readAsDataURL(file)

      // 异步上传（支持多图，不再 break）
      uploadInlineImage(file, uid)
    }
  }
}

async function uploadInlineImage(file, uid) {
  const fd = new FormData()
  // 注意: type/slug 必须先于 file 追加, 否则 multer destination 回调中 req.body 尚未解析完
  // type 用 'posts' (后端白名单 avatar/posts/cover, 'content' 会被拒绝)
  fd.append('type', 'posts')
  fd.append('slug', formSlug.value)
  fd.append('file', file)

  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: fd,
    })
    if (!res.ok) throw new Error('上传失败')
    const data = await res.json()
    // 按唯一 id 精确替换占位符（避免并发时错位）
    form.content = form.content.replace(
      new RegExp(`!\\[uploading-${uid}\\]\\(data:image\\/[^)]+\\)`),
      `![image](${data.url})`
    )
  } catch {
    // 按唯一 id 移除失败的占位符
    form.content = form.content.replace(
      new RegExp(`!\\[uploading-${uid}\\]\\(data:image\\/[^)]+\\)\\n?`),
      ''
    )
    showToast('图片上传失败', 'error')
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
    errors.title = '请输入标题'
    valid = false
  }
  if (!form.content.trim()) {
    errors.content = '请输入内容'
    valid = false
  }
  return valid
}

// ====== 上传封面 ======
async function uploadCover(postSlug) {
  if (!coverFile.value) return null

  const fd = new FormData()
  // 注意: type/slug 必须先于 file 追加, 否则 multer destination 回调中 req.body 尚未解析完
  fd.append('type', 'cover')
  fd.append('slug', postSlug)
  fd.append('file', coverFile.value)

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

// ====== 保存 / 发布 ======
async function saveDraft() {
  form.status = 'draft'
  await savePost()
}

async function publish() {
  const prevStatus = form.status
  form.status = 'published'
  const ok = await savePost()
  // 保存失败时回滚 status 指示器
  if (!ok) form.status = prevStatus
}

async function savePost() {
  // 并发保护：重复调用时忽略
  if (saving.value) return false
  if (!validate()) return false
  if (!isLoggedIn.value) {
    router.push('/')
    return false
  }

  // 图片上传中，禁止保存
  if (uploadingImages.value > 0) {
    showToast(`${uploadingImages.value} 张图片上传中 — 请稍候`, 'error')
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
      status: form.status,
    }
    // 仅管理员发送 is_pinned
    if (isAdmin.value) {
      payload.is_pinned = form.is_pinned
    }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(payload),
    })


    const data = await res.json()
    if (!res.ok) throw new Error(data.message || '保存失败')

    const savedSlug = data.post?.slug || data.slug || formSlug.value

    const isPublish = form.status === 'published'
    let coverFailed = false

    // 如果有封面图，上传并回填
    if (coverFile.value && savedSlug) {
      const coverUrl = await uploadCover(savedSlug)
      if (coverUrl) {
        await fetch(`${API_BASE}/posts/${savedSlug}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ cover_image: coverUrl }),
        }).catch(() => {})
      } else {
        coverFailed = true
      }
    }

    // 清除本地草稿
    clearDraft()

    // 标记为非脏
    snapshot()
    coverFile.value = null

    // Toast
    let toastMsg = isPublish ? '发布成功！' : '草稿已保存'
    if (coverFailed) toastMsg += '（封面上传失败）'
    showToast(toastMsg, coverFailed ? 'error' : 'success')
    autoSaveLabel.value = ''

    // 草稿留在编辑器；发布成功才跳文章详情
    if (isPublish) {
      router.push(`/post/${savedSlug}`)
    }
    return true
  } catch (e) {
    serverError.value = e.message || '保存失败'
    showToast(e.message || '保存失败', 'error')
    return false
  } finally {
    saving.value = false
  }
}

// ====== 加载已有文章（编辑模式） ======
async function loadPost() {
  if (!isEditMode.value) return

  try {
    const res = await fetch(`${API_BASE}/posts/${editSlug.value}`, {
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    })
    if (!res.ok) {
      if (res.status === 404) {
        serverError.value = '文章不存在'
        return
      }
      throw new Error('加载失败')
    }
    const data = await res.json()
    const p = data.post

    if (p.author && currentUser.value && p.author.username !== currentUser.value.username && !isAdmin.value) {
      serverError.value = '你不是该文章作者'
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
    autoSaveLabel.value = '已自动保存'
    setTimeout(() => { autoSaveLabel.value = '' }, 2000)
  } catch { /* storage full */ }
}

function restoreDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const draft = JSON.parse(raw)
    // 草稿 TTL 放宽到 12 小时（避免长时间编辑被误清）
    if (Date.now() - draft.savedAt > 12 * 60 * 60 * 1000) {
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
  // 保存中禁止离开，避免 savePost 完成后强制跳转打断用户
  if (saving.value) {
    window.alert('正在保存中 — 请稍候')
    return next(false)
  }
  if (isDirty.value) {
    const leave = window.confirm('存在未保存的更改 — 仍要离开吗？')
    if (!leave) return next(false)
  }
  next()
})

function handleBeforeUnload(e) {
  if (isDirty.value) {
    // 同步保存草稿（sessionStorage 是同步 API，beforeunload 中安全）
    saveDraftLocal()
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
      showToast('已恢复上次会话的草稿')
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
  // 清理防抖定时器，防止卸载后回写已发布内容
  clearTimeout(autoSaveTimer)
  // 离开前保存草稿（仅新建模式，编辑模式不覆盖本地草稿）
  if (!isEditMode.value && isDirty.value && (form.title.trim() || form.content.trim())) {
    saveDraftLocal()
  }
  window.removeEventListener('keydown', handleKeyboard)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 内容变化时自动存草稿（3秒防抖），包含 is_pinned
watch(
  () => [form.title, form.content, form.excerpt, formTags.value, form.is_pinned],
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
  background: var(--bg);
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: var(--text);
  position: relative;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(var(--overlay-a15) 1px, transparent 1px),
    linear-gradient(90deg, var(--overlay-a15) 1px, transparent 1px);
  background-size: 64px 64px;
  pointer-events: none; z-index: 0;
}

/* ====== Toast ====== */
.toast {
  position: fixed; top: 72px; right: 24px; z-index: 999;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; border-radius: 6px;
  font-family: inherit; font-size: 12px; font-weight: 600;
  box-shadow: 0 4px 24px var(--shadow);
  pointer-events: none;
}
.toast.success { background: var(--bg-elevated); border: 1px solid var(--ok-a30); color: var(--ok); }
.toast.error   { background: var(--bg-elevated); border: 1px solid var(--err-a30); color: var(--err); }
.toast-icon { font-weight: 800; font-size: 14px; }

.toast-enter-active { transition: all 0.25s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(16px); }

/* ====== Navbar ====== */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--navbar-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.navbar-inner {
  max-width: 100%; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; justify-content: space-between;
}

.brand {
  display: flex; align-items: baseline; gap: 4px;
  text-decoration: none; font-size: 14px; font-weight: 600;
}

.brand-bracket { color: var(--text-muted); }
.brand-text { color: var(--accent); }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }

.nav-actions { display: flex; align-items: center; gap: 12px; }

.auto-save-hint {
  font-size: 9px; color: var(--text-muted); font-weight: 600;
  letter-spacing: 0.5px; white-space: nowrap;
}

.draft-indicator {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  color: var(--warn); padding: 4px 12px;
  background: var(--warn-a8);
  border: 1px solid var(--warn-a20);
  border-radius: 4px;
}

.draft-indicator.published {
  color: var(--ok);
  background: var(--ok-a8);
  border-color: var(--ok-a20);
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
  color: var(--text-secondary); background: var(--overlay-a4);
  border-color: var(--border-strong);
}

.btn-draft:hover:not(:disabled) {
  border-color: var(--text-dim); color: var(--text);
}

.btn-publish {
  color: var(--on-accent); background: var(--accent);
}

.btn-publish:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 0 20px var(--accent-a25);
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
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 20px;
  overflow-y: auto;
}

.input-title {
  width: 100%; padding: 14px 0;
  font-family: inherit; font-size: 24px; font-weight: 800;
  color: var(--text-bright); background: none; border: none;
  border-bottom: 1px solid var(--border);
  outline: none; caret-color: var(--accent);
  letter-spacing: -0.5px;
}

.input-title::placeholder { color: var(--text-faint); }

.input-title.error { border-bottom-color: var(--err); }

.label-hint {
  font-size: 10px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 1.5px;
  margin-bottom: -14px;
  display: flex; align-items: center; gap: 6px;
}

.tag-count {
  font-size: 9px; color: var(--text-faint); font-weight: 400;
}

/* 标签输入 */
.tags-row { display: flex; flex-direction: column; gap: 8px; }

.tags-input-wrap {
  display: flex; flex-wrap: wrap; gap: 6px;
  align-items: center; padding: 8px 12px;
  background: var(--bg-elevated); border: 1px solid var(--border-strong);
  border-radius: 6px; min-height: 42px;
  transition: border-color 0.2s;
}

.tags-input-wrap:focus-within { border-color: var(--accent); }

.tag-chip {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; padding: 3px 8px;
  background: var(--accent-a8); color: var(--accent);
  border: 1px solid var(--accent-a20);
  border-radius: 4px; font-weight: 600;
}

.tag-remove {
  font-family: inherit; font-size: 13px; font-weight: 700;
  color: var(--accent); background: none; border: none;
  cursor: pointer; padding: 0; line-height: 1;
  opacity: 0.6; transition: opacity 0.2s;
}

.tag-remove:hover { opacity: 1; }

.input-tag {
  flex: 1; min-width: 100px;
  font-family: inherit; font-size: 13px;
  color: var(--text); background: none; border: none;
  outline: none; caret-color: var(--accent);
}

.input-tag::placeholder { color: var(--text-faint); }

.input-tag:disabled { opacity: 0.4; cursor: not-allowed; }

/* 封面上传 */
.cover-section { display: flex; flex-direction: column; gap: 8px; }

.cover-dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 28px;
  background: var(--bg-elevated); border: 2px dashed var(--border);
  border-radius: 8px; cursor: pointer; transition: all 0.2s;
}

.cover-dropzone:hover { border-color: var(--accent); background: var(--accent-a2); }

.cover-dropzone.hasImage { padding: 0; border-style: solid; }

.cover-preview {
  width: 100%; max-height: 180px; object-fit: cover;
  border-radius: 6px;
}

.dropzone-icon { font-size: 28px; opacity: 0.5; }
.dropzone-text { font-size: 12px; color: var(--text-muted); }

.file-hidden { display: none; }

.btn-remove-cover {
  align-self: flex-start;
  font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--err); background: none; border: none;
  cursor: pointer; transition: color 0.2s;
}

.btn-remove-cover:hover { color: var(--err-hover); }

/* 摘要 */
.input-excerpt {
  width: 100%; padding: 12px 14px;
  font-family: inherit; font-size: 13px; color: var(--text);
  background: var(--bg-elevated); border: 1px solid var(--border-strong);
  border-radius: 6px; outline: none; resize: none;
  caret-color: var(--accent); transition: border-color 0.2s;
}

.input-excerpt:focus { border-color: var(--accent); }
.input-excerpt::placeholder { color: var(--text-faint); }

/* 正文编辑 */
.input-content {
  flex: 1; min-height: 300px; width: 100%;
  padding: 14px; font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 14px; line-height: 1.75; color: var(--text);
  background: var(--bg-elevated); border: 1px solid var(--border-strong);
  border-radius: 8px; outline: none; resize: vertical;
  caret-color: var(--accent); transition: border-color 0.2s;
}

.input-content:focus { border-color: var(--accent); }
.input-content::placeholder { color: var(--text-faint); }
.input-content.error { border-color: var(--err); }

.field-err {
  font-size: 11px; color: var(--err);
  display: flex; align-items: center; gap: 4px;
}

.field-err::before { content: 'ERR!'; font-weight: 700; letter-spacing: 1px; }

.server-err {
  margin-top: 4px; padding: 8px 12px;
  background: var(--err-a6);
  border: 1px solid var(--err-a15);
  border-radius: 4px;
}
.server-err::before { display: none; }

/* 复选框 */
.checkbox-row {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
}

.checkbox-row input[type='checkbox'] { accent-color: var(--accent); width: 15px; height: 15px; }

.check-text { font-size: 12px; color: var(--text-dim); }

/* ====== 预览面板 ====== */
.preview-pane {
  display: flex; flex-direction: column;
  background: var(--bg-code);
  overflow: hidden;
}

.preview-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: var(--overlay-a1);
  border-bottom: 1px solid var(--border);
}

.preview-title {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  letter-spacing: 1px;
}

.preview-hint { font-size: 10px; color: var(--text-faint); }

.preview-scroll {
  flex: 1; overflow-y: auto; padding: 32px 36px;
}

.preview-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 80px 20px;
  font-size: 13px; color: var(--text-muted);
}

.preview-empty-icon { font-size: 36px; opacity: 0.3; }

/* 预览 Markdown 样式 — 复用 PostDetail */
.preview-body { font-size: 15px; line-height: 1.85; }

.preview-body :deep(h1),
.preview-body :deep(h2),
.preview-body :deep(h3) {
  color: var(--text-bright); font-weight: 700; margin: 28px 0 10px;
}

.preview-body :deep(h1) { font-size: 24px; }
.preview-body :deep(h2) { font-size: 19px; }
.preview-body :deep(h3) { font-size: 15px; }

.preview-body :deep(p) { margin: 0 0 14px; }

.preview-body :deep(a) {
  color: var(--accent); text-decoration: underline;
  text-underline-offset: 3px;
}

.preview-body :deep(code) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px; padding: 2px 6px;
  background: var(--overlay-a5); border: 1px solid var(--border);
  border-radius: 4px; color: var(--accent);
}

.preview-body :deep(pre) {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; padding: 16px 20px; overflow-x: auto; margin: 18px 0;
}

.preview-body :deep(pre code) {
  background: none; border: none; padding: 0; color: var(--text);
}

.preview-body :deep(blockquote) {
  border-left: 2px solid var(--accent); margin: 14px 0;
  padding: 6px 14px; color: var(--text-dim); font-style: italic;
}

.preview-body :deep(img) {
  max-width: 100%; border-radius: 8px;
  border: 1px solid var(--border); margin: 14px 0;
}

.preview-body :deep(ul),
.preview-body :deep(ol) { padding-left: 22px; margin: 10px 0; }
.preview-body :deep(li) { margin: 5px 0; }
.preview-body :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 28px 0; }

/* ====== 响应式 ====== */
@media (max-width: 900px) {
  .editor-main { grid-template-columns: 1fr; }
  .editor-pane { border-right: none; border-bottom: 1px solid var(--border); }
  .preview-pane { max-height: 50vh; }
  .input-title { font-size: 20px; }
  .btn-shortcut { display: none; }
}
</style>
