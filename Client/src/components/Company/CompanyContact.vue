<template>
  <CompanyShell>
    <div class="co-main">
      <section class="co-sec">
        <h1 class="co-page-title">联系</h1>
        <p class="co-lead">说清背景、目标和时间预期，一般一天内回。</p>
      </section>

      <section class="co-sec">
        <CompanySecHead title="怎么合作" note="TERMS" />
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
        <CompanySecHead title="联系方式" note="CONTACT" />
        <p class="co-lead">邮件里写清背景、目标和时间预期就行；微信适合先把需求聊粗。</p>
        <dl class="co-contact-list">
          <div class="co-contact-line"><dt>邮箱</dt><dd><a href="mailto:1903784785@qq.com">1903784785@qq.com</a></dd></div>
          <div class="co-contact-line"><dt>微信</dt><dd>Woodwhite-0827</dd></div>
          <div class="co-contact-line"><dt>GitHub</dt><dd><a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">github.com/woodwhite0ets</a></dd></div>
        </dl>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import CompanySecHead from './CompanySecHead.vue'
</script>
