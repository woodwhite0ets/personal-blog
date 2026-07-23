
<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>
 
    <div class="login-card">
      <!-- 终端装饰条 -->
      <div class="terminal-bar">
        <span class="terminal-dot dot-red"></span>
        <span class="terminal-dot dot-yellow"></span>
        <span class="terminal-dot dot-green"></span>
        <span class="terminal-title">auth --login</span>
      </div>
 
      <div class="card-body">
        <!-- 标题区 -->
        <div class="header">
          <div class="prompt-line">
            <span class="prompt-arrow">❯</span>
            <span class="prompt-cmd">ssh woodwhite@blog</span>
          </div>
          <p class="subtitle">
            <span class="comment">// 请输入凭据以继续</span>
          </p>
        </div>
 
        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field">
            <label for="username">
              <span class="label-icon">@</span> username
            </label>
            <div class="input-wrap">
              <input
                id="username"
                v-model.trim="form.username"
                type="text"
                placeholder="admin"
                autocomplete="username"
                :class="{ error: errors.username }"
                ref="usernameInput"
              />
              <span class="input-cursor" v-if="!form.username"></span>
            </div>
            <span v-if="errors.username" class="field-error">
              <span class="err-prefix">ERR!</span> {{ errors.username }}
            </span>
          </div>
 
          <div class="field">
            <label for="password">
              <span class="label-icon">#</span> password
            </label>
            <div class="input-wrap">
              <input
                id="password"
                v-model="form.password"
                type="password"
                placeholder="········"
                autocomplete="current-password"
                :class="{ error: errors.password }"
              />
            </div>
            <span v-if="errors.password" class="field-error">
              <span class="err-prefix">ERR!</span> {{ errors.password }}
            </span>
          </div>
 
          <div class="field-row">
            <label class="checkbox-label">
              <input v-model="form.remember" type="checkbox" />
              <span class="check-text">--keep-alive (stay logged in)</span>
            </label>
          </div>
 
          <p v-if="serverError" class="server-error">
            <span class="err-prefix">ERR!</span> {{ serverError }}
          </p>
 
          <button type="submit" class="btn-login" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-if="!loading" class="btn-arrow">❯</span>
            {{ loading ? 'Authenticating...' : 'Enter' }}
          </button>
        </form>

        <!-- 游客入口 -->
        <div class="guest-section">
          <div class="guest-divider">
            <span class="divider-line"></span>
            <span class="divider-text">-- or --</span>
            <span class="divider-line"></span>
          </div>
          <button class="btn-guest" @click="handleGuestLogin" :disabled="guestLoading">
            <span v-if="guestLoading" class="spinner-guest"></span>
            <span v-else class="guest-icon">👤</span>
            {{ guestLoading ? 'Entering...' : 'Continue as Guest' }}
          </button>
          <p class="guest-hint">
            <span class="comment">// 只读模式：可浏览文章，无需注册</span>
          </p>
        </div>

        <p class="back-link">
          <router-link to="/RegisterPage">← register for more</router-link>
        </p>
      </div>
 
      <div class="terminal-status">
        <span class="status-dot"></span>
        <span>ENCRYPTED</span>
        <span class="status-sep">|</span>
        <span>PORT :::3027</span>
      </div>
    </div>
  </div>
</template>
 
<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../../stores/auth.js'

const router = useRouter()
const route = useRoute()
const { login, loginAsGuest } = useAuth()

const form = reactive({ username: '', password: '', remember: false })
const errors = reactive({ username: '', password: '' })
const serverError = ref('')
const loading = ref(false)
const guestLoading = ref(false)

function validate() {
  let valid = true
  errors.username = ''
  errors.password = ''
  serverError.value = ''

  if (!form.username) {
    errors.username = 'username is required'
    valid = false
  }
  if (!form.password) {
    errors.password = 'password is required'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = 'minimum 6 characters'
    valid = false
  }
  return valid
}

async function handleLogin() {
  if (!validate()) return
  loading.value = true
  try {
    await login(form.username, form.password, form.remember)
    const redirect = route.query.redirect || '/HomePage'
    router.push(redirect)
  } catch (e) {
    serverError.value = e.message || 'connection refused'
  } finally {
    loading.value = false
  }
}

async function handleGuestLogin() {
  guestLoading.value = true
  serverError.value = ''
  try {
    await loginAsGuest()
    const redirect = route.query.redirect || '/HomePage'
    router.push(redirect)
  } catch (e) {
    serverError.value = e.message || 'guest login failed'
  } finally {
    guestLoading.value = false
  }
}
</script>
 
<style scoped>
/* ==============================
   Base
   ============================== */
.login-page {
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
 
/* ---- 背景网格 ---- */
.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}
 
/* ---- 背景光晕 ---- */
.bg-glow {
  position: fixed;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%);
  pointer-events: none;
  animation: glowPulse 6s ease-in-out infinite;
}
 
@keyframes glowPulse {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}
 
/* ==============================
   Card
   ============================== */
.login-card {
  position: relative;
  width: 420px;
  max-width: 92vw;
  background: #16171b;
  border: 1px solid #25262a;
  border-radius: 10px;
  box-shadow: 0 0 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset;
  overflow: hidden;
}
 
/* ---- 终端装饰条 ---- */
.terminal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #1c1d21;
  border-bottom: 1px solid #25262a;
}
 
.terminal-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
 
.dot-red    { background: #ff5f57; }
.dot-yellow { background: #feba0a; }
.dot-green  { background: #2bd64e; }
 
.terminal-title {
  flex: 1;
  text-align: center;
  font-size: 11px;
  color: #5a5d64;
  letter-spacing: 1px;
}
 
/* ---- 卡片主体 ---- */
.card-body {
  padding: 36px 32px 28px;
}
 
/* ---- 标题 ---- */
.header {
  margin-bottom: 36px;
}
 
.prompt-line {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  margin-bottom: 8px;
}
 
.prompt-arrow {
  color: #00d4ff;
  font-weight: 700;
}
 
.prompt-cmd {
  color: #e6edf3;
  font-weight: 600;
  letter-spacing: 0.5px;
}
 
.subtitle {
  margin: 0;
  font-size: 12px;
  color: #484b52;
  padding-left: 2px;
}
 
.comment {
  color: #484b52;
  font-style: italic;
}
 
/* ==============================
   Form
   ============================== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
 
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
 
.field label {
  font-size: 11px;
  font-weight: 600;
  color: #6e737a;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}
 
.label-icon {
  color: #00d4ff;
  font-weight: 700;
}
 
.input-wrap {
  position: relative;
  display: flex;
}
 
.field input[type='text'],
.field input[type='password'] {
  width: 100%;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 14px;
  color: #e6edf3;
  background: #0f1013;
  border: 1px solid #25262a;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  caret-color: #00d4ff;
}
 
.field input:focus {
  border-color: #00d4ff;
  box-shadow: 0 0 0 3px rgba(0,212,255,0.08), 0 0 20px rgba(0,212,255,0.04);
}
 
.field input.error {
  border-color: #ff5f57;
  box-shadow: 0 0 0 3px rgba(255,95,87,0.08);
}
 
.field input::placeholder {
  color: #33363c;
}
 
.field-error {
  font-size: 11px;
  color: #ff5f57;
  display: flex;
  align-items: center;
  gap: 6px;
}
 
.err-prefix {
  font-weight: 700;
  letter-spacing: 1px;
}
 
/* ---- 复选框 ---- */
.field-row {
  display: flex;
  align-items: center;
}
 
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
 
.checkbox-label input[type='checkbox'] {
  accent-color: #00d4ff;
  width: 15px;
  height: 15px;
}
 
.check-text {
  font-size: 12px;
  color: #6e737a;
}
 
/* ---- 按钮 ---- */
.btn-login {
  width: 100%;
  padding: 13px 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #0c0c0d;
  background: linear-gradient(135deg, #00d4ff 0%, #00b8d4 100%);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}
 
.btn-login::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 100%);
  opacity: 0;
  transition: opacity 0.2s;
}
 
.btn-login:hover:not(:disabled)::before {
  opacity: 1;
}
 
.btn-login:hover:not(:disabled) {
  box-shadow: 0 0 30px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1);
  transform: translateY(-1px);
}
 
.btn-login:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
 
.btn-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
 
.btn-arrow {
  font-size: 16px;
}
 
/* ---- 错误 ---- */
.server-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #ff5f57;
  background: rgba(255,95,87,0.06);
  border: 1px solid rgba(255,95,87,0.15);
  padding: 10px 14px;
  border-radius: 6px;
  margin: 0;
}
 
/* ---- 游客 ---- */
.guest-section {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guest-divider {
  display: flex;
  align-items: center;
  gap: 12px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: #1c1d21;
}

.divider-text {
  font-size: 10px;
  font-weight: 600;
  color: #33363c;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.btn-guest {
  width: 100%;
  padding: 13px 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #00d4ff;
  background: transparent;
  border: 2px dashed #25262a;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-guest:hover:not(:disabled) {
  border-color: #00d4ff;
  background: rgba(0,212,255,0.04);
  box-shadow: 0 0 24px rgba(0,212,255,0.12);
  transform: translateY(-1px);
}

.btn-guest:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.btn-guest:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.guest-icon {
  font-size: 18px;
}

.guest-hint {
  text-align: center;
  margin: 0;
}

.guest-hint .comment {
  font-size: 11px;
  color: #484b52;
  font-style: italic;
}

.spinner-guest {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0,212,255,0.15);
  border-top-color: #00d4ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* ---- 返回 ---- */
.back-link {
  text-align: center;
  margin: 24px 0 0;
}
 
.back-link a {
  font-size: 12px;
  color: #484b52;
  text-decoration: none;
  transition: color 0.2s;
}
 
.back-link a:hover {
  color: #00d4ff;
}
 
/* ---- 底部状态条 ---- */
.terminal-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #0f1013;
  border-top: 1px solid #25262a;
  font-size: 10px;
  color: #484b52;
  letter-spacing: 1.5px;
}
 
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2bd64e;
  box-shadow: 0 0 6px rgba(43,214,78,0.4);
}
 
.status-sep {
  color: #25262a;
}
 
/* ==============================
   Spinner
   ============================== */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(12,12,13,0.3);
  border-top-color: #0c0c0d;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
 
@keyframes spin {
  to { transform: rotate(360deg); }
}
 
/* ==============================
   Responsive
   ============================== */
@media (max-width: 460px) {
  .card-body {
    padding: 28px 20px 22px;
  }
  .prompt-line {
    font-size: 15px;
  }
}
</style>
 
