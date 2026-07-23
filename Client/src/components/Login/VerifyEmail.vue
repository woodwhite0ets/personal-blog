<template>
  <div class="verify-page">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="verify-card">
      <div class="terminal-bar">
        <span class="terminal-dot dot-red"></span>
        <span class="terminal-dot dot-yellow"></span>
        <span class="terminal-dot dot-green"></span>
        <span class="terminal-title">systemd --verify-email</span>
      </div>

      <div class="card-body">
        <!-- 加载中 -->
        <div v-if="loading" class="state">
          <span class="spinner"></span>
          <span class="state-text">verifying...</span>
        </div>

        <!-- 成功 -->
        <div v-else-if="success" class="state success">
          <div class="verify-icon">✓</div>
          <div class="prompt-line">
            <span class="prompt-arrow">❯</span>
            <span class="prompt-cmd">verify --success</span>
          </div>
          <p class="verify-text">
            邮箱验证成功！<br/>
            欢迎 <strong>@{{ username }}</strong>
          </p>
          <router-link to="/HomePage" class="btn-home">
            <span class="btn-arrow">❯</span> enter blog
          </router-link>
        </div>

        <!-- 失败 -->
        <div v-else class="state error">
          <span class="err-prefix">ERR!</span>
          <div class="prompt-line">
            <span class="prompt-arrow">❯</span>
            <span class="prompt-cmd">verify --failed</span>
          </div>
          <p class="verify-text">{{ errorMessage }}</p>
          <router-link to="/RegisterPage" class="btn-register">
            ← 重新注册
          </router-link>
        </div>
      </div>

      <div class="terminal-status">
        <span class="status-dot" :class="success ? '' : 'error-dot'"></span>
        <span>{{ success ? 'VERIFIED' : 'FAILED' }}</span>
        <span class="status-sep">|</span>
        <span>PORT :::3027</span>
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
      errorMessage.value = data.message || 'verification failed'
      return
    }

    success.value = true
    username.value = data.user?.username || ''

    // 验证成功 → 自动保存 JWT
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.removeItem('guest_mode')
      localStorage.removeItem('guest_user')
      await fetchMe()
    }
  } catch {
    errorMessage.value = 'connection refused'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0c0c0d;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9;
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.bg-glow {
  position: fixed; top: -20%; left: 50%; transform: translateX(-50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%);
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
  background: #16171b;
  border: 1px solid #25262a;
  border-radius: 10px;
  box-shadow: 0 0 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset;
  overflow: hidden;
}

.terminal-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: #1c1d21;
  border-bottom: 1px solid #25262a;
}

.terminal-dot { width: 11px; height: 11px; border-radius: 50%; }
.dot-red    { background: #ff5f57; }
.dot-yellow { background: #feba0a; }
.dot-green  { background: #2bd64e; }

.terminal-title {
  flex: 1; text-align: center;
  font-size: 11px; color: #5a5d64; letter-spacing: 1px;
}

.card-body { padding: 40px 32px 32px; }

.state {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; text-align: center;
}

.state-text { font-size: 13px; color: #484b52; }

/* Success */
.state.success .verify-icon {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(43,214,78,0.1);
  border: 2px solid #2bd64e;
  border-radius: 50%;
  font-size: 28px; font-weight: 700; color: #2bd64e;
}

.prompt-line { display: flex; align-items: center; gap: 10px; font-size: 15px; }
.prompt-arrow { color: #00d4ff; font-weight: 700; }
.prompt-cmd { color: #e6edf3; font-weight: 600; }

.verify-text {
  font-size: 14px; color: #8b9098; line-height: 1.7; margin: 0;
}

.verify-text strong { color: #00d4ff; font-weight: 600; }

.btn-home {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 36px;
  font-family: inherit; font-size: 14px; font-weight: 600; letter-spacing: 1px;
  color: #0c0c0d;
  background: linear-gradient(135deg, #00d4ff 0%, #00b8d4 100%);
  border-radius: 6px; text-decoration: none;
  transition: all 0.2s;
}

.btn-home:hover {
  box-shadow: 0 0 30px rgba(0,212,255,0.3);
  transform: translateY(-1px);
}

.btn-arrow { font-size: 16px; }

/* Error */
.err-prefix { font-weight: 700; letter-spacing: 1px; font-size: 24px; color: #ff5f57; }

.btn-register {
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: #00d4ff; text-decoration: none; transition: color 0.2s;
}

.btn-register:hover { color: #00b8d4; }

/* Spinner */
.spinner {
  width: 24px; height: 24px;
  border: 2px solid #1c1d21;
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.terminal-status {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px;
  background: #0f1013; border-top: 1px solid #25262a;
  font-size: 10px; color: #484b52; letter-spacing: 1.5px;
}

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #2bd64e;
  box-shadow: 0 0 6px rgba(43,214,78,0.4);
}

.status-dot.error-dot { background: #ff5f57; }

.status-sep { color: #25262a; }

@media (max-width: 460px) {
  .card-body { padding: 32px 20px 24px; }
}
</style>
