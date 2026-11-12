<template>
  <footer class="co-foot">
    <div class="co-foot-cols">
      <div class="co-foot-brand">
        <span class="co-foot-id">
          <img class="co-foot-mark" src="/brand/opc-mark-gray.svg" alt="" width="955" height="672" aria-hidden="true" />
          <span class="co-foot-name">木白 woodwhite</span>
        </span>
        <p>给已经在跑的业务加 AI 能力，一个人从头做到上线后的巡检。</p>
        <span class="co-foot-copy">© {{ year }} 木白 woodwhite</span>
      </div>
      <nav class="co-foot-col" aria-label="服务">
        <p class="co-foot-k">服务</p>
        <router-link to="/business">业务总览</router-link>
        <router-link :to="{ path: '/', hash: '#scope' }">定制交付</router-link>
        <router-link to="/business/startup">初创版官网</router-link>
        <router-link :to="{ path: '/', hash: '#pricing' }">合作方式</router-link>
      </nav>
      <nav class="co-foot-col" aria-label="站点">
        <p class="co-foot-k">站点</p>
        <router-link to="/work">案例</router-link>
        <router-link to="/stack">能力</router-link>
        <router-link to="/contact">联系</router-link>
        <router-link to="/blog">博客</router-link>
      </nav>
      <nav class="co-foot-col" aria-label="联系">
        <p class="co-foot-k">联系</p>
        <a href="mailto:1903784785@qq.com">1903784785@qq.com</a>
        <a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span>厦门 · 翔安</span>
        <span>可开票</span>
      </nav>
    </div>
  </footer>
</template>

<script setup>
// 公司站页脚：四个页面同一份（原先首页是四列、子页只有两个外链）
const year = new Date().getFullYear()
</script>
