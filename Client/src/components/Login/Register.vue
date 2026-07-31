
Registerview · VUE
<template>
  <div class="register-page">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>
 
    <div class="register-card">
      <div class="terminal-bar">
        <span class="terminal-dot dot-red"></span>
        <span class="terminal-dot dot-yellow"></span>
        <span class="terminal-dot dot-green"></span>
        <span class="terminal-title">useradd --register</span>
      </div>
 
      <div class="card-body">
        <!-- 步骤指示器 -->
        <div class="steps">
          <div class="step" :class="{ active: step === 1, done: step > 1 }">
            <span class="step-num">{{ step > 1 ? '✓' : '1' }}</span>
            <span class="step-label">注册</span>
          </div>
          <div class="step-line" :class="{ done: step > 1 }"></div>
          <div class="step" :class="{ active: step === 2 }">
            <span class="step-num">2</span>
            <span class="step-label">验证</span>
          </div>
        </div>
 
        <!-- ====== 步骤 1：注册表单 ====== -->
        <template v-if="step === 1">
          <!-- 实时头像预览 -->
          <div class="avatar-preview">
            <div class="avatar-circle">{{ previewChar }}</div>
            <span class="avatar-hint">user.avatar</span>
          </div>

          <div class="header">
            <div class="prompt-line">
              <span class="prompt-arrow">❯</span>
              <span class="prompt-cmd">create_user --new</span>
            </div>
            <p class="subtitle">
              <span class="comment">// 创建你的账户</span>
            </p>
          </div>
 
          <form @submit.prevent="handleRegister" class="register-form">
            <div class="field">
              <label for="username">
                <span class="label-icon">@</span> username
              </label>
              <input
                id="username"
                v-model.trim="form.username"
                type="text"
                placeholder="3-20 位字母数字下划线"
                autocomplete="username"
                :class="{ error: errors.username }"
              />
              <span v-if="errors.username" class="field-error">
                <span class="err-prefix">ERR!</span> {{ errors.username }}
              </span>
            </div>
 
            <div class="field">
              <label for="nickname">
                <span class="label-icon">N</span> nickname
              </label>
              <input
                id="nickname"
                v-model.trim="form.nickname"
                type="text"
                placeholder="显示名称"
                :class="{ error: errors.nickname }"
              />
              <span v-if="errors.nickname" class="field-error">
                <span class="err-prefix">ERR!</span> {{ errors.nickname }}
              </span>
            </div>
 
            <div class="field">
              <label for="email">
                <span class="label-icon">@</span> email
              </label>
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                :class="{ error: errors.email }"
              />
              <span v-if="errors.email" class="field-error">
                <span class="err-prefix">ERR!</span> {{ errors.email }}
              </span>
            </div>
 
            <div class="field">
              <label for="password">
                <span class="label-icon">#</span> password
              </label>
              <div class="password-wrap">
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="至少 8 位，含字母和数字"
                  autocomplete="new-password"
                  :class="{ error: errors.password }"
                />
                <button
                  type="button"
                  class="toggle-pw"
                  @click="showPassword = !showPassword"
                  tabindex="-1"
                >
                  {{ showPassword ? 'hide' : 'show' }}
                </button>
              </div>
              <span v-if="errors.password" class="field-error">
                <span class="err-prefix">ERR!</span> {{ errors.password }}
              </span>
              <div v-if="form.password" class="password-strength">
                <span
                  v-for="i in 4"
                  :key="i"
                  class="strength-bar"
                  :class="strengthClass(i)"
                ></span>
                <span class="strength-text">{{ strengthLabel }}</span>
              </div>
            </div>
 
            <div class="field">
              <label for="confirm">
                <span class="label-icon">#</span> confirm
              </label>
              <input
                id="confirm"
                v-model="form.confirm"
                type="password"
                placeholder="再次输入密码"
                autocomplete="new-password"
                :class="{ error: errors.confirm }"
              />
              <span v-if="errors.confirm" class="field-error">
                <span class="err-prefix">ERR!</span> {{ errors.confirm }}
              </span>
            </div>
 
            <p v-if="serverError" class="server-error">
              <span class="err-prefix">ERR!</span> {{ serverError }}
            </p>
 
            <button type="submit" class="btn-submit" :disabled="loading">
              <span v-if="loading" class="spinner"></span>
              <span v-if="!loading" class="btn-arrow">❯</span>
              {{ loading ? 'Creating...' : 'Register' }}
            </button>
          </form>
        </template>
 
        <!-- ====== 步骤 2：验证提示 ====== -->
        <template v-else>
          <div class="verify-prompt">
            <div class="verify-icon">✉</div>
            <div class="prompt-line">
              <span class="prompt-arrow">❯</span>
              <span class="prompt-cmd">check_inbox --wait</span>
            </div>
            <p class="verify-text">
              一封验证邮件已发送到<br/>
              <strong>{{ form.email }}</strong>
            </p>
            <p class="verify-hint">
              点击邮件里的链接即可完成注册。<br/>
              没收到？检查垃圾邮件或
              <button class="link-btn" @click="handleResend" :disabled="resending">
                {{ resending ? 'Sending...' : '重新发送' }}
              </button>
            </p>
          </div>
        </template>
 
        <p class="back-link">
          <router-link to="/">← Have account? to Login</router-link>
        </p>
      </div>
 
      <div class="terminal-status">
        <span class="status-dot"></span>
        <span>TLS 1.3</span>
        <span class="status-sep">|</span>
        <span>PORT :::3027</span>
      </div>
    </div>
  </div>
</template>
 
<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../stores/auth.js'

const router = useRouter()
const { login: authLogin } = useAuth()

const API_BASE = '/api'

const step = ref(1)
const loading = ref(false)
const resending = ref(false)
const serverError = ref('')
const showPassword = ref(false)
 
const form = reactive({
  username: '',
  nickname: '',
  email: '',
  password: '',
  confirm: '',
})
 
const errors = reactive({
  username: '',
  nickname: '',
  email: '',
  password: '',
  confirm: '',
})
 
// ====== 密码强度 ======
function getPasswordStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/(?=.*[a-zA-Z])(?=.*\d)/.test(pw)) score += 2
  if (pw.length >= 10) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  return Math.min(score, 4)
}
 
const strengthLevel = computed(() => getPasswordStrength(form.password))

// ====== 头像预览字符 ======
const previewChar = computed(() => {
  if (form.nickname) return form.nickname.charAt(0).toUpperCase()
  if (form.username) return form.username.charAt(0).toUpperCase()
  return '?'
})
 
const strengthLabels = ['', '弱', '一般', '良好', '强']
 
const strengthLabel = computed(() => {
  return form.password ? strengthLabels[strengthLevel.value] : ''
})
 
function strengthClass(i) {
  if (!form.password) return ''
  if (i <= strengthLevel.value) {
    const colors = ['', 'bar-weak', 'bar-fair', 'bar-good', 'bar-strong']
    return colors[strengthLevel.value]
  }
  return ''
}
 
// ====== 表单校验 ======
function validate() {
  let valid = true
  errors.username = ''
  errors.nickname = ''
  errors.email = ''
  errors.password = ''
  errors.confirm = ''
  serverError.value = ''
 
  if (!form.username) {
    errors.username = '请输入用户名'
    valid = false
  } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
    errors.username = '3-20 位字母数字或下划线'
    valid = false
  }
 
  if (!form.nickname) {
    errors.nickname = '请输入显示名称'
    valid = false
  } else if (form.nickname.length > 50) {
    errors.nickname = '显示名称过长'
    valid = false
  }
 
  if (!form.email) {
    errors.email = '请输入邮箱'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = '邮箱格式不正确'
    valid = false
  }
 
  if (!form.password) {
    errors.password = '请输入密码'
    valid = false
  } else if (form.password.length < 8) {
    errors.password = '密码至少 8 位'
  } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
    errors.password = '密码需包含字母和数字'
    valid = false
  }
 
  if (form.password !== form.confirm) {
    errors.confirm = '两次密码不一致'
    valid = false
  }
 
  return valid
}
 
// ====== 提交注册 ======
async function handleRegister() {
  if (!validate()) return
 
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        nickname: form.nickname,
        email: form.email,
        password: form.password,
      }),
    })
 
    const data = await res.json()
 
    if (!res.ok) {
      serverError.value = data.message || '注册失败'
      return
    }
 
    // 注册成功 → 进入验证步骤
    step.value = 2
  } catch {
    serverError.value = 'connection refused — 请检查后端'
  } finally {
    loading.value = false
  }
}

// ====== 重新发送验证邮件 ======
async function handleResend() {
  resending.value = true
  serverError.value = ''
  try {
    const res = await fetch(`${API_BASE}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email }),
    })
    const data = await res.json()
    if (!res.ok) {
      serverError.value = data.message || '发送失败'
    }
  } catch {
    serverError.value = 'connection refused'
  } finally {
    resending.value = false
  }
}
</script>
 
<style scoped>
.register-page {
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
 
.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(var(--overlay-a2) 1px, transparent 1px),
    linear-gradient(90deg, var(--overlay-a2) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}
 
.bg-glow {
  position: fixed;
  top: -20%; left: 50%; transform: translateX(-50%);
  width: 600px; height: 600px;
  background: radial-gradient(circle, var(--accent-a6) 0%, transparent 70%);
  pointer-events: none;
  animation: glowPulse 6s ease-in-out infinite;
}
 
@keyframes glowPulse {
  0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
}
 
/* ====== 头像预览 ====== */
.avatar-preview {
  display: flex; flex-direction: column; align-items: center;
  margin-bottom: 24px; gap: 8px;
}

.avatar-circle {
  width: 64px; height: 64px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--accent-a20) 0%, var(--accent-a5) 100%);
  border: 2px solid var(--accent-a25);
  border-radius: 12px;
  font-size: 28px; font-weight: 800; color: var(--accent);
  text-transform: uppercase;
  transition: all 0.3s;
}

.avatar-hint {
  font-size: 10px; color: var(--text-muted);
  letter-spacing: 1px; text-transform: lowercase;
}

/* ====== 卡片 ====== */
.register-card {
  position: relative;
  width: 440px;
  max-width: 92vw;
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
 
.card-body {
  padding: 32px 32px 24px;
}
 
/* ====== 步骤指示器 ====== */
.steps {
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 32px;
}
 
.step {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
 
.step-num {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  font-size: 13px; font-weight: 700;
  background: var(--border); color: var(--text-muted);
  border: 2px solid var(--border-strong);
  transition: all 0.3s;
}
 
.step.active .step-num {
  border-color: var(--accent); color: var(--accent);
  box-shadow: 0 0 12px var(--accent-a20);
}
 
.step.done .step-num {
  background: var(--accent); color: var(--bg-deeper); border-color: var(--accent);
}
 
.step-label {
  font-size: 10px; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase;
}
 
.step.active .step-label { color: var(--accent); }
.step.done .step-label { color: var(--text-dim); }
 
.step-line {
  width: 60px; height: 1px; background: var(--border-strong); margin: 0 12px 22px; transition: background 0.3s;
}
 
.step-line.done { background: var(--accent); }
 
/* ====== 头部 ====== */
.header { margin-bottom: 28px; }
 
.prompt-line {
  display: flex; align-items: center; gap: 10px;
  font-size: 16px; margin-bottom: 6px;
}
 
.prompt-arrow { color: var(--accent); font-weight: 700; }
.prompt-cmd { color: var(--text-bright); font-weight: 600; }
 
.subtitle { margin: 0; font-size: 12px; color: var(--text-muted); }
.comment { color: var(--text-muted); font-style: italic; }
 
/* ====== 表单 ====== */
.register-form {
  display: flex; flex-direction: column; gap: 16px;
}
 
.field {
  display: flex; flex-direction: column; gap: 6px;
}
 
.field label {
  font-size: 10px; font-weight: 600; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 1.5px;
  display: flex; align-items: center; gap: 6px;
}
 
.label-icon { color: var(--accent); font-weight: 700; }
 
.field input[type='text'],
.field input[type='email'],
.field input[type='password'] {
  width: 100%;
  padding: 10px 12px;
  font-family: inherit; font-size: 13px;
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
 
.field input::placeholder { color: var(--text-faint); font-size: 12px; }
 
/* 密码可见切换 */
.password-wrap {
  position: relative; display: flex;
}
 
.password-wrap input { padding-right: 50px; }
 
.toggle-pw {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  font-family: inherit; font-size: 10px; font-weight: 600;
  color: var(--text-muted); background: none; border: none;
  cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
  transition: color 0.2s;
}
 
.toggle-pw:hover { color: var(--accent); }
 
/* 密码强度 */
.password-strength {
  display: flex; align-items: center; gap: 4px; margin-top: 2px;
}
 
.strength-bar {
  width: 100%; height: 3px; background: var(--border); border-radius: 2px;
  transition: background 0.3s;
}
 
.strength-bar.bar-weak   { background: var(--err); }
.strength-bar.bar-fair   { background: var(--warn); }
.strength-bar.bar-good   { background: var(--ok); }
.strength-bar.bar-strong { background: var(--accent); }
 
.strength-text {
  font-size: 10px; margin-left: 6px; color: var(--text-muted); min-width: 24px;
}
 
.field-error {
  font-size: 11px; color: var(--err);
  display: flex; align-items: center; gap: 6px;
}
 
.err-prefix { font-weight: 700; letter-spacing: 1px; }
 
/* 提交按钮 */
.btn-submit {
  width: 100%; padding: 13px 0;
  font-family: inherit; font-size: 14px; font-weight: 600; letter-spacing: 1px;
  color: var(--bg-deeper);
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  border: none; border-radius: 6px; cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  position: relative; overflow: hidden;
  margin-top: 4px;
}
 
.btn-submit::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 0%, var(--overlay-a10) 100%);
  opacity: 0; transition: opacity 0.2s;
}
 
.btn-submit:hover:not(:disabled)::before { opacity: 1; }
.btn-submit:hover:not(:disabled) {
  box-shadow: 0 0 30px var(--accent-a30), 0 0 60px var(--accent-a10);
  transform: translateY(-1px);
}
.btn-submit:active:not(:disabled) { transform: translateY(0) scale(0.99); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-arrow { font-size: 16px; }
 
.server-error {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--err);
  background: var(--err-a6);
  border: 1px solid var(--err-a15);
  padding: 10px 14px; border-radius: 6px; margin: 0;
}
 
/* ====== 验证步骤 ====== */
.verify-prompt {
  text-align: center; padding: 20px 0 10px;
}
 
.verify-icon {
  font-size: 48px; margin-bottom: 20px;
  filter: grayscale(1);
  animation: float 3s ease-in-out infinite;
}
 
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
 
.verify-text {
  font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin: 20px 0 16px;
}
 
.verify-text strong {
  color: var(--accent); font-weight: 600;
}
 
.verify-hint {
  font-size: 12px; color: var(--text-muted); line-height: 1.8;
}
 
.link-btn {
  font-family: inherit; font-size: 12px; font-weight: 600;
  color: var(--accent); background: none; border: none;
  cursor: pointer; text-decoration: underline;
  transition: color 0.2s;
}
 
.link-btn:hover { color: var(--accent-hover); }
.link-btn:disabled { opacity: 0.5; cursor: not-allowed; }
 
/* ====== 底部 ====== */
.back-link {
  text-align: center; margin: 22px 0 0;
}
 
.back-link a {
  font-size: 12px; color: var(--text-muted); text-decoration: none; transition: color 0.2s;
}
 
.back-link a:hover { color: var(--accent); }
 
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
 
.status-sep { color: var(--border-strong); }
 
/* ====== 加载 ====== */
.spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--bg-deeper);
  border-top-color: var(--bg-deeper);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
 
@keyframes spin { to { transform: rotate(360deg); } }
 
/* ====== 响应式 ====== */
@media (max-width: 480px) {
  .card-body { padding: 24px 20px 18px; }
}
</style>
 
