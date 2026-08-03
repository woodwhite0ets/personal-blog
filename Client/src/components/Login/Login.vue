
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
          <span class="back-sep">·</span>
          <router-link to="/forgot-password" class="forgot-link">forgot password?</router-link>
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
  background: var(--bg-deeper);
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: var(--text);
  position: relative;
  overflow: hidden;
}
 
/* ---- 背景网格 ---- */
.bg-grid {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(var(--overlay-a2) 1px, transparent 1px),
    linear-gradient(90deg, var(--overlay-a2) 1px, transparent 1px);
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
  background: radial-gradient(circle, var(--accent-a6) 0%, transparent 70%);
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
  background: var(--bg-float);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  box-shadow: 0 0 60px var(--shadow), 0 0 0 1px var(--overlay-a3) inset;
  overflow: hidden;
}
 
/* ---- 终端装饰条 ---- */
.terminal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--border);
  border-bottom: 1px solid var(--border-strong);
}
 
.terminal-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
 
.dot-red    { background: var(--err); }
.dot-yellow { background: var(--warn); }
.dot-green  { background: var(--ok); }
 
.terminal-title {
  flex: 1;
  text-align: center;
  font-size: 11px;
  color: var(--text-hint);
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
  color: var(--accent);
  font-weight: 700;
}
 
.prompt-cmd {
  color: var(--text-bright);
  font-weight: 600;
  letter-spacing: 0.5px;
}
 
.subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  padding-left: 2px;
}
 
.comment {
  color: var(--text-muted);
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
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}
 
.label-icon {
  color: var(--accent);
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
  color: var(--text-bright);
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  caret-color: var(--accent);
}
 
.field input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-a8), 0 0 20px var(--accent-a4);
}
 
.field input.error {
  border-color: var(--err);
  box-shadow: 0 0 0 3px var(--err-a8);
}
 
.field input::placeholder {
  color: var(--text-faint);
}
 
.field-error {
  font-size: 11px;
  color: var(--err);
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
  accent-color: var(--accent);
  width: 15px;
  height: 15px;
}
 
.check-text {
  font-size: 12px;
  color: var(--text-dim);
}
 
/* ---- 按钮 ---- */
.btn-login {
  width: 100%;
  padding: 13px 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--bg-deeper);
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
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
  background: linear-gradient(135deg, transparent 0%, var(--overlay-a10) 100%);
  opacity: 0;
  transition: opacity 0.2s;
}
 
.btn-login:hover:not(:disabled)::before {
  opacity: 1;
}
 
.btn-login:hover:not(:disabled) {
  box-shadow: 0 0 30px var(--accent-a30), 0 0 60px var(--accent-a10);
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
  color: var(--err);
  background: var(--err-a6);
  border: 1px solid var(--err-a15);
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
  background: var(--border);
}

.divider-text {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-faint);
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
  color: var(--accent);
  background: transparent;
  border: 2px dashed var(--border-strong);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-guest:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-a4);
  box-shadow: 0 0 24px var(--accent-a12);
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
  color: var(--text-muted);
  font-style: italic;
}

.spinner-guest {
  width: 18px;
  height: 18px;
  border: 2px solid var(--accent-a15);
  border-top-color: var(--accent);
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
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}
 
.back-link a:hover {
  color: var(--accent);
}

.back-sep {
  margin: 0 6px;
  color: var(--text-faint);
}

.forgot-link {
  color: var(--warn) !important;
}

/* ---- 底部状态条 ---- */
.terminal-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border-strong);
  font-size: 10px;
  color: var(--text-muted);
  letter-spacing: 1.5px;
}
 
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ok);
  box-shadow: 0 0 6px var(--ok-a40);
}
 
.status-sep {
  color: var(--border-strong);
}
 
/* ==============================
   Spinner
   ============================== */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--bg-deeper);
  border-top-color: var(--bg-deeper);
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
 
