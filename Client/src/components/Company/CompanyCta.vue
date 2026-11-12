<template>
  <section class="co-cta paper-field">
    <div class="co-cta-in">
      <div class="co-cta-copy">
        <h2 class="co-cta-title">{{ title }}</h2>
        <p class="co-note">{{ note }}</p>
      </div>
      <div class="co-cta-contact">
        <p class="co-cta-k">下一步</p>
        <div class="co-cta-actions">
          <router-link class="co-btn co-btn-solid" to="/contact#brief">填需求单</router-link>
          <a class="co-cta-mail" href="mailto:1903784785@qq.com">或发邮件 1903784785@qq.com</a>
        </div>
        <p class="co-cta-hint">{{ hint }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
// 公司站收尾面板：六个页面共用一份，避免每页各写一遍导致间距和文案走样。
defineProps({
  title: { type: String, required: true },
  note: { type: String, default: '签合同，可开票，按阶段验收。' },
  hint: { type: String, default: '一般一天内回信。' },
})
</script>
