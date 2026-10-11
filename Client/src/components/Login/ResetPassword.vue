<template>
  <div class="reset-page">

    <div class="card">
      <div class="card-body">
        <div class="header">
          <h1 class="auth-title">重置密码</h1>
          <p class="subtitle">
             设置新密码（至少 8 位，含字母和数字）
          </p>
        </div>

        <!-- 成功状态 -->
        <div v-if="done" class="success-box">
          <div class="success-icon">✓</div>
          <p class="success-text">密码已重置成功</p>
          <router-link to="/login" class="btn-back">返回登录</router-link>
        </div>

        <!-- 表单 -->
        <form v-else @submit.prevent="handleReset" class="form">
          <div class="field">
            <label for="password">新密码</label>
            <div class="input-wrap">
              <input
                id="password"
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                autocomplete="new-password"
                :class="{ error: errors.password }"
              />
            </div>
            <span v-if="errors.password" class="field-error">
              {{ errors.password }}
            </span>
          </div>

          <div class="field">
            <label for="confirm">确认密码</label>
            <div class="input-wrap">
              <input
                id="confirm"
                v-model="form.confirm"
                type="password"
                placeholder="••••••••"
                autocomplete="new-password"
                :class="{ error: errors.confirm }"
              />
            </div>
            <span v-if="errors.confirm" class="field-error">
              {{ errors.confirm }}
            </span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            <span v-if="loading" class="spinner" role="status" aria-label="提交中"></span>
            
            {{ loading ? '重置中…' : '重置密码' }}
          </button>
        </form>

        <p class="back-link">
          <router-link to="/login">返回登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const form = reactive({ password: '', confirm: '' })
const errors = reactive({ password: '', confirm: '' })
const loading = ref(false)
const done = ref(false)

async function handleReset() {
  errors.password = ''
  errors.confirm = ''

  if (form.password.length < 8 || !/(?=.*[a-zA-Z])(?=.*\d)/.test(form.password)) {
    errors.password = '密码至少 8 位，且需包含字母和数字'
    return
  }
  if (form.password !== form.confirm) {
    errors.confirm = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: route.params.token, newPassword: form.password }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      done.value = true
    } else {
      errors.confirm = data.message || '重置密码失败，请重试'
    }
  } catch {
    errors.confirm = '网络连接失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-page {
  min-height: 100dvh;
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
.dot-red { background: var(--dot-red); } .dot-yellow { background: var(--dot-yellow); } .dot-green { background: var(--dot-green); }
.terminal-title { margin-left: auto; font-size: 11px; color: var(--text-muted); font-family: var(--font-sans); }

.card-body { padding: 28px; }
.header { margin-bottom: 24px; }
.prompt-line { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.prompt-arrow { color: var(--accent); font-weight: 700; }
.prompt-cmd { color: var(--text-bright); font-weight: 600; }
.subtitle { margin: 0; }
.comment { color: var(--text-faint); font-size: 12px; }

.field { margin-bottom: 20px; }
.field label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
.label-icon { color: var(--accent); }
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

.spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: var(--white); border-radius: 50%; animation: spin 0.8s linear infinite; }
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

/* 统一：auth 卡片宽度 420 */
.login-card, .register-card, .verify-card, .card { max-width: 420px; margin: 0 auto; }
</style>

<style scoped>
.forgot-page, .reset-page { min-height:100dvh; display:block; padding:72px 24px; background:var(--bg); }
.card { width:100%; max-width:1000px; margin:0 auto; background:transparent; border:0; border-radius:0; box-shadow:none; }
.card-body { max-width:560px; margin:0 auto; padding:0; }
.auth-title { font-family:var(--font-hand); font-size:clamp(40px,5vw,64px); text-align:left; border-bottom:1px solid var(--border); padding-bottom:16px; }

/* ===== 父级收口：清掉终端风残留（渐变/光晕/卡片阴影/装饰符号）===== */
.err-prefix, .terminal-status, .terminal-bar, .terminal-dot, .terminal-title,
.prompt-line, .prompt-arrow, .prompt-cmd, .status-dot, .status-sep,
.bg-glow, .verify-icon, .label-icon { display: none !important; }
.btn-glow { background: var(--accent) !important; box-shadow: none !important; }
.btn-glow::before { display: none !important; }
.login-card, .register-card, .verify-card, .card-body { box-shadow: none !important; animation: none !important; }
.login-page, .register-page, .verify-page { background-image: none !important; }
</style>
