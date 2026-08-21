<template>
  <div class="forgot-page">
    <div class="bg-grid"></div>
    <div class="bg-glow"></div>

    <div class="card">
      <div class="terminal-bar">
        <span class="terminal-dot dot-red"></span>
        <span class="terminal-dot dot-yellow"></span>
        <span class="terminal-dot dot-green"></span>
        <span class="terminal-title">auth --forgot</span>
      </div>

      <div class="card-body">
        <div class="header">
          <div class="prompt-line">
            <span class="prompt-arrow">❯</span>
            <span class="prompt-cmd">reset password</span>
          </div>
          <p class="subtitle">
            <span class="comment">// 输入注册邮箱，我们会发送重置链接</span>
          </p>
        </div>

        <!-- 成功状态 -->
        <div v-if="sent" class="success-box">
          <div class="success-icon">✓</div>
          <p class="success-text">if this email is registered, a reset link has been sent.</p>
          <p class="comment success-hint">// 请查收邮箱（含垃圾箱），链接 1 小时内有效</p>
          <router-link to="/login" class="btn-back">← back to login</router-link>
        </div>

        <!-- 表单 -->
        <form v-else @submit.prevent="handleSend" class="form">
          <div class="field">
            <label for="email"><span class="label-icon">@</span> email</label>
            <div class="input-wrap">
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                placeholder="you@example.com"
                autocomplete="email"
                :class="{ error: errors.email }"
              />
            </div>
            <span v-if="errors.email" class="field-error">
              <span class="err-prefix">ERR!</span> {{ errors.email }}
            </span>
          </div>

          <button type="submit" class="btn-send" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else class="btn-arrow">❯</span>
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <p class="back-link">
          <router-link to="/login">← back to login</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

const form = reactive({ email: '' })
const errors = reactive({ email: '' })
const loading = ref(false)
const sent = ref(false)

async function handleSend() {
  errors.email = ''
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'enter a valid email address'
    return
  }
  loading.value = true
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email }),
    })
    if (res.ok) {
      sent.value = true
    } else {
      const data = await res.json().catch(() => ({}))
      errors.email = data.message || 'request failed'
    }
  } catch {
    errors.email = 'network error — please try again'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-page {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  position: relative;
  background: var(--bg);
}
.bg-grid { position: fixed; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 40px 40px; opacity: 0.3; }
.bg-glow { position: fixed; top: -20%; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, var(--accent-a10) 0%, transparent 60%); pointer-events: none; }

.card {
  width: 100%; max-width: 420px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-deep);
}
.terminal-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: var(--bg-deeper); border-bottom: 1px solid var(--border); }
.terminal-dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-red { background: #ff5f56; } .dot-yellow { background: #ffbd2e; } .dot-green { background: #27c93f; }
.terminal-title { margin-left: auto; font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

.card-body { padding: 28px; }
.header { margin-bottom: 24px; }
.prompt-line { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.prompt-arrow { color: var(--accent); font-weight: 700; }
.prompt-cmd { color: var(--text-bright); font-weight: 600; }
.subtitle { margin: 0; }
.comment { color: var(--text-faint); font-size: 12px; }
.success-hint { margin-top: 8px; }

.field { margin-bottom: 20px; }
.field label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
.label-icon { color: var(--accent); }
.input-wrap { position: relative; }
.input-wrap input {
  width: 100%; padding: 12px 14px;
  background: var(--bg-deeper); color: var(--text);
  border: 1px solid var(--border-strong); border-radius: 6px;
  font-family: inherit; font-size: 14px; outline: none;
  transition: border-color 0.2s;
}
.input-wrap input:focus { border-color: var(--accent); }
.input-wrap input.error { border-color: var(--err); }
.field-error { display: block; margin-top: 6px; font-size: 12px; color: var(--err); }
.err-prefix { font-weight: 700; }

.btn-send {
  width: 100%; padding: 12px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: var(--accent); color: var(--on-accent);
  border: none; border-radius: 6px; font-weight: 700; cursor: pointer;
  font-family: inherit; transition: opacity 0.2s;
}
.btn-send:hover { opacity: 0.85; }
.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-arrow { font-weight: 700; }
.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.success-box { text-align: center; padding: 12px 0; }
.success-icon {
  width: 56px; height: 56px; margin: 0 auto 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 700; color: var(--ok);
  border: 2px solid var(--ok); border-radius: 50%;
}
.success-text { color: var(--text); font-size: 14px; margin-bottom: 8px; }
.btn-back { display: inline-block; margin-top: 16px; color: var(--accent); text-decoration: none; font-size: 14px; }

.back-link { margin-top: 20px; text-align: center; }
.back-link a { color: var(--text-muted); text-decoration: none; font-size: 13px; }
.back-link a:hover { color: var(--accent); }
</style>
