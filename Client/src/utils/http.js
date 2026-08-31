// ====== 统一前端 HTTP 客户端（知识库 / 网关共用） ======
// 所有后端调用都走同一源（blog.woodwhite.top），由边缘 Caddy 按前缀分发：
//   /api/blog/*    -> 博客后端
//   /api/gateway/* -> 网关 / 知识库后端
// 网关接口统一加 /api/gateway 前缀；基于浏览器的 Cookie（credentials:'include'），
// 并与博客 JWT 打通（SSO）：首次调用若发现网关会话不存在，则用博客 JWT 自动登录网关。
import { getToken } from '../stores/auth.js'

// 把 /api/* 网关路径改写为 /api/gateway/*（幂等，避免重复前缀）
export function gatewayPath(path) {
  if (path.startsWith('/api/gateway')) return path
  return path.replace(/^\/api(?=\/|$)/, '/api/gateway')
}

async function rawApi(path, options = {}) {
  const response = await fetch(gatewayPath(path), {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`)
  return body
}

// 确保网关会话存在：优先复用已有 mcp_console_session，否则用博客 JWT SSO 登录
export async function ensureGatewaySession() {
  try {
    await rawApi('/api/me')
    return true
  } catch { /* fall through */ }
  const blogJwt = getToken()
  if (!blogJwt) return false
  try {
    await rawApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ token: blogJwt }) })
    return true
  } catch {
    return false
  }
}

// 发起一次网关 API 调用
export async function gatewayApi(path, options = {}) {
  return rawApi(path, options)
}

export default gatewayApi
