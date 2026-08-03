import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE = '/api'

// ====== Token 存储助手 ======
function decodeTokenPayload(token) {
  const payload = token.split('.')[1]
  const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  return JSON.parse(atob(b64 + pad))
}

function saveToken(token, remember) {
  // 清除所有旧数据
  localStorage.removeItem('token')
  localStorage.removeItem('token_expires')
  localStorage.removeItem('remember_me')
  localStorage.removeItem('guest_mode')
  localStorage.removeItem('guest_user')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('token_expires')
  sessionStorage.removeItem('guest_mode')
  sessionStorage.removeItem('guest_user')

  if (remember) {
    localStorage.setItem('token', token)
    localStorage.setItem('remember_me', '1')
  } else {
    // 不记住：仅存 sessionStorage，关闭浏览器自动清除
    sessionStorage.setItem('token', token)
  }

  // 从 JWT 解码过期时间并存储（供路由守卫快速检测）
  try {
    const payload = decodeTokenPayload(token)
    if (payload.exp) {
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('token_expires', String(payload.exp * 1000))
    }
  } catch {}
}

export function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

export function isGuest() {
  return localStorage.getItem('guest_mode') === '1' || sessionStorage.getItem('guest_mode') === '1'
}

function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('token_expires')
  localStorage.removeItem('remember_me')
  localStorage.removeItem('guest_mode')
  localStorage.removeItem('guest_user')
  // 只清 token 相关，保留 sessionStorage 里的编辑器草稿（blog_editor_draft）
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('token_expires')
  sessionStorage.removeItem('guest_mode')
  sessionStorage.removeItem('guest_user')
}

// ====== 全局单例状态 ======
const currentUser = ref(null)
const authLoading = ref(false)

// ====== composable ======
export function useAuth() {
  const router = useRouter()

  const isLoggedIn = computed(() => !!currentUser.value && !currentUser.value.isGuest)
  const isAdmin = computed(() => !!currentUser.value && currentUser.value.role === 'admin')

  // ====== 从 token 获取当前用户信息 ======
  async function fetchMe() {
    const token = getToken()
    if (!token) return

    if (isGuest()) {
      try {
        const storage = localStorage.getItem('guest_mode') === '1' ? localStorage : sessionStorage
        const raw = storage.getItem('guest_user')
        if (raw) currentUser.value = JSON.parse(raw)
      } catch {}
      return
    }

    authLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        clearToken()
        currentUser.value = null
        return
      }
      const data = await res.json()
      currentUser.value = data.user
    } catch {
      // 连接失败保留 token，不清除
    } finally {
      authLoading.value = false
    }
  }

  // ====== 登录 ======
  async function login(username, password, remember = false) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'authentication failed')

    saveToken(data.token, remember)
    currentUser.value = data.user || null
    return data
  }

  // ====== 游客登录 ======
  async function loginAsGuest() {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'guest login failed')

    // 游客始终用 sessionStorage（关闭浏览器即失效）
    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('guest_mode', '1')
    sessionStorage.setItem('guest_user', JSON.stringify(data.user))
    currentUser.value = data.user || null
    return data
  }

  // ====== 退出 ======
  function logout() {
    clearToken()
    currentUser.value = null
    router.push('/')
  }

  return {
    currentUser,
    isLoggedIn,
    isAdmin,
    authLoading,
    fetchMe,
    login,
    loginAsGuest,
    logout,
  }
}
