<template>
  <CompanyShell>
    <div class="co-main">
      <CompanyMasthead
        title="联系"
        lead="说清背景、目标和时间预期，一般一天内回。"
      />
      <section class="co-sec">
        <CompanySecHead title="怎么合作" />
        <div class="co-grid co-grid-2">
          <div class="co-card">
            <h3>按项目</h3>
            <p>需求清楚、边界明确的功能或系统。先给方案与报价，再开工。</p>
          </div>
          <div class="co-card">
            <h3>按月</h3>
            <p>长期迭代或运维，每周固定时间投入，适合已有产品的团队。</p>
          </div>
        </div>
        <p class="co-note">签合同、可开票，按阶段交付并留验收标准。首次沟通不收费；需求没想清楚也可以先聊。</p>
      </section>

      <section class="co-sec">
        <CompanySecHead title="留个需求" />
        <form class="co-form" novalidate @submit.prevent="submit">
          <div class="co-form-row">
            <label class="co-field">
              <span class="co-field-k">称呼</span>
              <input v-model="form.name" type="text" name="name" autocomplete="name" maxlength="40" placeholder="怎么称呼你……" required />
            </label>
            <label class="co-field">
              <span class="co-field-k">联系方式</span>
              <input v-model="form.contact" type="text" name="contact" autocomplete="email" maxlength="80" placeholder="邮箱或微信号……" required />
            </label>
          </div>
          <label class="co-field">
            <span class="co-field-k">需求</span>
            <textarea v-model="form.message" name="message" rows="4" maxlength="2000" placeholder="想做什么、现在卡在哪、希望什么时候上线……" required></textarea>
          </label>
          <!-- 蜜罐：正常用户看不到 -->
          <input v-model="form.website" class="co-honeypot" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <div class="co-form-foot">
            <button type="submit" class="co-btn co-btn-solid" :disabled="state === 'sending'">
              {{ state === 'sending' ? '发送中…' : '发送' }}
            </button>
            <span class="co-form-hint">一般一天内回信；不想填表也可以直接发邮件。</span>
          </div>
          <p class="co-form-status" role="status" aria-live="polite">{{ statusText }}</p>
        </form>
      </section>

      <section class="co-sec">
        <CompanySecHead title="联系方式" />
        <p class="co-lead">邮件里写清背景、目标和时间预期就行；微信适合先把需求聊粗。</p>
        <dl class="co-contact-list">
          <div class="co-contact-line">
            <dt>邮箱</dt>
            <dd>
              <a href="mailto:1903784785@qq.com">{{ EMAIL }}</a>
              <button type="button" class="co-copy" :aria-label="`复制邮箱 ${EMAIL}`" @click="copy(EMAIL, 'email')">
                {{ copied === 'email' ? '已复制' : '复制' }}
              </button>
            </dd>
          </div>
          <div class="co-contact-line">
            <dt>微信</dt>
            <dd>
              <span class="co-copy-value">{{ WECHAT }}</span>
              <button type="button" class="co-copy" :aria-label="`复制微信号 ${WECHAT}`" @click="copy(WECHAT, 'wechat')">
                {{ copied === 'wechat' ? '已复制' : '复制' }}
              </button>
            </dd>
          </div>
          <div class="co-contact-line"><dt>GitHub</dt><dd><a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">github.com/woodwhite0ets</a></dd></div>
        </dl>
        <p class="co-copy-status" role="status" aria-live="polite">{{ copyStatus }}</p>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'
import { ref, computed, onBeforeUnmount } from 'vue'

// 联系表单：POST /api/contact，只发信不落库；蜜罐字段挡机器人
const form = ref({ name: '', contact: '', message: '', website: '' })
const state = ref('idle')
const formError = ref('')

const statusText = computed(() => {
  if (state.value === 'sending') return ''
  if (state.value === 'sent') return '已收到，会用你留的方式回信。'
  if (state.value === 'error') return formError.value
  return ''
})

async function submit() {
  if (state.value === 'sending') return
  const { name, contact, message } = form.value
  if (!name.trim() || !contact.trim() || message.trim().length < 5) {
    state.value = 'error'
    formError.value = '称呼、联系方式、需求都填一下，需求至少写五个字。'
    return
  }
  state.value = 'sending'
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || '发送失败，稍后再试')
    state.value = 'sent'
    form.value = { name: '', contact: '', message: '', website: '' }
  } catch (e) {
    state.value = 'error'
    formError.value = `${e.message}。也可以直接发邮件或加微信。`
  }
}

// 微信号/邮箱一键复制：手机上从网页里手动选中一串 ID 很别扭
const EMAIL = '1903784785@qq.com'
const WECHAT = 'Woodwhite-0827'
const copied = ref('')
const copyStatus = ref('')
let timer = null

async function copy(text, key) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // 非 HTTPS 或权限被拒：退回临时选中，别让按钮点了没反应
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch { /* 忽略 */ }
    document.body.removeChild(ta)
  }
  copied.value = key
  copyStatus.value = key === 'email' ? '邮箱已复制' : '微信号已复制'
  clearTimeout(timer)
  timer = setTimeout(() => { copied.value = ''; copyStatus.value = '' }, 2000)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>
