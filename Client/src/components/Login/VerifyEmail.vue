<template>
  <div class="verify-page">
    <span class="edge-label" aria-hidden="true">邮箱验证 · woodwhite@blog</span>

    <div class="verify-card">
      <div class="card-body">
        <!-- 加载中 -->
        <div v-if="loading" class="state deco-hero deco-hero-sm">
          <h1 class="auth-title">验证邮箱</h1>
          <span class="spinner" role="status" aria-label="加载中"></span>
          <span class="state-text">正在验证邮箱…</span>
        </div>

        <!-- 成功 -->
        <div v-else-if="success" class="state success deco-hero deco-hero-sm">
          <h1 class="auth-title">邮箱已验证</h1>
          <p class="verify-text">
            邮箱验证成功！<br/>
            欢迎 <strong>@{{ username }}</strong>
          </p>
          <router-link to="/HomePage" class="btn btn-primary">
             进入博客
          </router-link>
        </div>

        <!-- 失败 -->
        <div v-else class="state error deco-hero deco-hero-sm">
          <h1 class="auth-title">验证邮箱</h1>
          <p class="verify-text">{{ errorMessage }}</p>
          <router-link to="/RegisterPage" class="btn-register deco-link">
            重新注册
          </router-link>
        </div>
        <span class="deco-end" aria-hidden="true"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '../../stores/auth.js'

const route = useRoute()
const { fetchMe } = useAuth()

const API_BASE = '/api'

const loading = ref(true)
const success = ref(false)
const errorMessage = ref('')
const username = ref('')

onMounted(async () => {
  try {
    const token = route.params.token
    const res = await fetch(`${API_BASE}/auth/verify-email/${token}`)
    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.message || '邮箱验证失败，请重试'
      return
    }

    success.value = true
    username.value = data.user?.username || ''

    // 验证成功 → 自动保存 JWT（同时清理 localStorage + sessionStorage 的游客态）
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.removeItem('guest_mode')
      localStorage.removeItem('guest_user')
      sessionStorage.removeItem('guest_mode')
      sessionStorage.removeItem('guest_user')
      await fetchMe()
    }
  } catch {
    errorMessage.value = '网络连接失败，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.verify-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deeper);
  font-family: var(--font-sans);
  color: var(--text);
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(var(--overlay-a2) 1px, transparent 1px),
    linear-gradient(90deg, var(--overlay-a2) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.bg-glow {
  position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, var(--accent-a6) 0%, transparent 70%);
  pointer-events: none;
  animation: glowPulse 6s ease-in-out infinite;
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}

.verify-card {
  position: relative;
  width: 420px; max-width: 92vw;
  background: var(--bg-float);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  box-shadow: 0 0 60px var(--shadow), 0 0 0 1px var(--overlay-a3) inset;
  overflow: hidden;
}

.terminal-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: var(--border);
  border-bottom: 1px solid var(--border-strong);
}

.terminal-dot { width: 11px; height: 11px; border-radius: 50%; }
.dot-red    { background: var(--err); }
.dot-yellow { background: var(--warn); }
.dot-green  { background: var(--ok); }

.terminal-title {
  flex: 1; text-align: center;
  font-size: 11px; color: var(--text-hint); letter-spacing: 1px;
}

.card-body { padding: 40px 32px 32px; }

.state {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; text-align: center;
}

.state-text { font-size: 13px; color: var(--text-muted); }

/* Success */
.state.success .verify-icon {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: var(--ok-a10);
  border: 2px solid var(--ok);
  border-radius: 50%;
  font-size: 28px; font-weight: 700; color: var(--ok);
}

.prompt-line { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.prompt-arrow { color: var(--accent); font-weight: 700; }
.prompt-cmd { color: var(--text-bright); font-weight: 600; }

.verify-text {
  font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin: 0;
}

.verify-text strong { color: var(--accent); font-weight: 600; }

.btn-glow {
  padding: 12px 36px;
  font-size: 14px;
  letter-spacing: 1px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
}

.btn-glow:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  box-shadow: 0 0 30px var(--accent-a30);
  transform: translateY(-1px);
}

.btn-arrow { font-size: 16px; }

/* Error */
.err-prefix { font-weight: 700; letter-spacing: 1px; font-size: 24px; color: var(--err); }

.btn-register {
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: var(--accent); text-decoration: none; transition: color 0.2s;
}

.btn-register:hover { color: var(--accent-hover); }

/* Spinner */
.spinner {
  width: 24px; height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.terminal-status {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: var(--bg-elevated); border-top: 1px solid var(--border-strong);
  font-size: 10px; color: var(--text-muted); letter-spacing: 1.5px;
}

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--ok);
  box-shadow: 0 0 6px var(--ok-a40);
}

.status-dot.error-dot { background: var(--err); }

.status-sep { color: var(--border-strong); }

@media (max-width: 460px) {
  .card-body { padding: 32px 20px 24px; }
}

/* 统一：auth 卡片宽度 420 */
.login-card, .register-card, .verify-card, .card { max-width: 420px; margin: 0 auto; }
</style>

<style scoped>
.verify-page { min-height:100dvh; display:block; padding:72px 24px; background:var(--bg); }
.verify-card { width:100%; max-width:1000px; margin:0 auto; background:transparent; border:0; border-radius:0; box-shadow:none; }
.card-body { max-width:560px; margin:0 auto; padding:0; }
.auth-title { font-family:var(--font-hand); font-size:clamp(40px,5vw,64px); text-align:left; border-bottom:1px solid var(--border); padding-bottom:16px; }
.terminal-status { display:none; }

/* ===== 父级收口：清掉终端风残留（渐变/光晕/卡片阴影/装饰符号）===== */
.err-prefix, .terminal-status, .terminal-bar, .terminal-dot, .terminal-title,
.prompt-line, .prompt-arrow, .prompt-cmd, .status-dot, .status-sep,
.bg-glow, .verify-icon, .label-icon { display: none !important; }
.btn-glow { background: var(--accent) !important; box-shadow: none !important; }
.btn-glow::before { display: none !important; }
.login-card, .register-card, .verify-card, .card-body { box-shadow: none !important; animation: none !important; }
.login-page, .register-page, .verify-page { background-image: none !important; }
</style>
