
<template>
  <div class="login-page">

    <span class="edge-label" aria-hidden="true">登录 · woodwhite@blog</span>

    <div class="login-card">
      <div class="card-body">
        <div class="header deco-hero deco-hero-sm">
          <h1 class="login-title">woodwhite@blog</h1>
          <p class="subtitle">登录以继续</p>
        </div>
 
        <!-- 表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field">
            <label for="username">
              用户名
            </label>
            <div class="input-wrap">
              <input
                id="username"
                v-model.trim="form.username" name="username" spellcheck="false"
                type="text"
                placeholder="admin"
                autocomplete="username"
                :class="{ error: errors.username }"
                ref="usernameInput"
              />
              <span class="input-cursor" v-if="!form.username"></span>
            </div>
            <span v-if="errors.username" class="field-error">
              {{ errors.username }}
            </span>
          </div>
 
          <div class="field">
            <label for="password">
              密码
            </label>
            <div class="input-wrap">
              <input
                id="password"
                v-model="form.password" name="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="········"
                autocomplete="current-password"
                :class="{ error: errors.password }"
              />
              <button
                type="button"
                class="pw-toggle"
                :aria-pressed="showPassword"
                :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                @click="showPassword = !showPassword"
              >{{ showPassword ? '隐藏' : '显示' }}</button>
            </div>
            <span v-if="errors.password" class="field-error">
              {{ errors.password }}
            </span>
          </div>
 
          <div class="field-row">
            <label class="checkbox-label">
              <input v-model="form.remember" type="checkbox" />
              <span class="check-text">记住我（保持登录状态）</span>
            </label>
          </div>
 
          <p v-if="serverError" class="server-error">
            {{ serverError }}
          </p>
 
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner" role="status" aria-label="提交中"></span>
            
            {{ loading ? '登录中…' : '进入' }}
          </button>
        </form>

        <!-- 游客入口 -->
        <div class="guest-section">
          <div class="guest-divider">
            <span class="divider-line"></span>
            <span class="divider-text">或</span>
            <span class="divider-line"></span>
          </div>
          <button class="btn btn-ghost btn-guest" @click="handleGuestLogin" :disabled="guestLoading">
            <span v-if="guestLoading" class="spinner-guest"></span>
            <span v-else class="guest-icon"></span>
            {{ guestLoading ? '进入中…' : '以游客身份浏览' }}
          </button>
          <p class="guest-hint">
             只读模式：可浏览文章，无需注册
          </p>
        </div>

        <p class="back-link">
          <router-link to="/RegisterPage" class="deco-link">注册一个账号</router-link>
          <router-link to="/forgot-password" class="forgot-link deco-link">忘记密码？</router-link>
        </p>
        <span class="deco-end" aria-hidden="true"></span>
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

const showPassword = ref(false)
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
    errors.username = '请输入用户名'
    valid = false
  }
  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  } else if (form.password.length < 8) {
    errors.password = '密码至少 8 位'
    valid = false
  }
  return valid
}

async function handleLogin() {
  if (!validate()) return
  loading.value = true
  try {
    await login(form.username, form.password, form.remember)
    const redirect = route.query.redirect || '/blog'
    router.push(redirect)
  } catch (e) {
    serverError.value = e.message || '连接失败，请重试'
  } finally {
    loading.value = false
  }
}

async function handleGuestLogin() {
  guestLoading.value = true
  serverError.value = ''
  try {
    await loginAsGuest()
    const redirect = route.query.redirect || '/blog'
    router.push(redirect)
  } catch (e) {
    serverError.value = e.message || '游客登录失败'
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
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-deeper);
  font-family: var(--font-sans);
  color: var(--text);
  position: relative;
  overflow: hidden;
}
 
/* ==============================
   Card
   ============================== */
.login-card {
  position: relative;
  width: 420px;
  max-width: 92vw;
  background-color: var(--bg-float);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  box-shadow: 0 0 60px var(--shadow), 0 0 0 1px var(--overlay-a3) inset;
  overflow: hidden;
}
 
/* ---- 卡片主体 ---- */
.card-body {
  padding: 36px 32px 28px;
}
 
/* ---- 标题 ---- */
.header {
  margin-bottom: 36px;
}
 
.subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  padding-left: 2px;
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
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-faint);
  text-transform: none;
  letter-spacing: .08em;
  display: flex;
  align-items: center;
  gap: 6px;
}
 
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.pw-toggle {
  position: absolute; right: 8px;
  font: inherit; font-size: 0.75rem; padding: 4px 8px;
  border-radius: 4px; border: 1px solid transparent;
  background: none; color: var(--text-dim); cursor: pointer;
}
.pw-toggle:hover { color: var(--text); border-color: var(--border); }
.pw-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
 
.field input[type='text'],
.field input[type='password'] {
  width: 100%;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 0.875rem;
  color: var(--text-bright);
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
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
  font-size: 0.6875rem;
  color: var(--err);
  display: flex;
  align-items: center;
  gap: 6px;
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
  font-size: 0.75rem;
  color: var(--text-dim);
}
 
 
/* ---- 错误 ---- */
.server-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--err);
  background: var(--err-a6);
  border: 1px solid var(--err-a15);
  padding: 10px 14px;
  border-radius: 8px;
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
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--text-dim);
  letter-spacing: 0;
  text-transform: none;
}

.btn-guest {
  width: 100%;
  padding: 13px 0;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: .02em;
  color: var(--text);
  background: transparent;
  border: 1px solid var(--border-strong);
  gap: 10px;
}

.btn-guest:hover:not(:disabled) {
  color: var(--text-bright);
  border-color: var(--text-bright);
  background: var(--overlay-a2);
  box-shadow: none;
  transform: none;
}

.btn-guest:active:not(:disabled) { transform: translateY(0) scale(0.99); }

.guest-icon {
  font-size: 1.125rem;
}

.guest-hint {
  text-align: center;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: .04em;
  color: var(--text-faint);
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
  font-size: 0.75rem;
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

.back-link { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
.forgot-link { color: var(--text-dim) !important; }

 
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
    font-size: 0.9375rem;
  }
}

/* 信笺风登录页（2026-10-11） */
.login-title { font-family: var(--font-display); font-size: 1.75rem; font-weight: 500; letter-spacing: -0.02em; color: var(--text-bright); margin: 0 0 6px; }
.login-card { border-radius: 4px; box-shadow: none; border: 1px solid var(--border-strong); }
.card-body { padding: 40px 36px; }
.subtitle { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .06em; color: var(--text-faint); }

/* 统一：auth 卡片宽度 420 */
.login-card, .register-card, .verify-card, .card { max-width: 420px; margin: 0 auto; }
</style>
 

<style scoped>
.login-page { min-height: 100dvh; display:block; padding:72px 24px; background-color: var(--bg); }
.login-card { width:100%; max-width:1000px; margin:0 auto; background:transparent; border:0; border-radius:0; box-shadow:none; }
.card-body { max-width:560px; margin:0 auto; padding:0; }
.login-title, .auth-title { font-family: var(--font-display); font-weight: 500; letter-spacing: -0.025em; font-size: clamp(2rem,3.4vw,2.6rem); text-align:left; padding-bottom:16px; margin: 0 0 4px; }
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
