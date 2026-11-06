<template>
  <footer class="co-foot">
    <div class="co-foot-cols">
      <div class="co-foot-brand">
        <span class="co-foot-name">木白 woodwhite</span>
        <p>把 AI 接进业务，做到能上线。一个人从头跟到尾。</p>
        <span class="co-foot-copy">© {{ year }} 木白 woodwhite</span>
      </div>
      <nav class="co-foot-col" aria-label="服务">
        <h3>服务</h3>
        <router-link :to="{ path: '/', hash: '#scope' }">能接的活</router-link>
        <router-link :to="{ path: '/', hash: '#standard' }">交付标准</router-link>
        <router-link :to="{ path: '/', hash: '#pricing' }">合作方式</router-link>
        <router-link :to="{ path: '/', hash: '#faq' }">常见问题</router-link>
      </nav>
      <nav class="co-foot-col" aria-label="站点">
        <h3>站点</h3>
        <router-link to="/work">案例</router-link>
        <router-link to="/stack">能力</router-link>
        <router-link to="/contact">联系</router-link>
        <router-link to="/blog">博客</router-link>
      </nav>
      <nav class="co-foot-col" aria-label="联系">
        <h3>联系</h3>
        <a href="mailto:1903784785@qq.com">1903784785@qq.com</a>
        <a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">GitHub</a>
        <span>浙江 · 乐清</span>
        <span>可开票</span>
      </nav>
    </div>
  </footer>
</template>

<script setup>
// 公司站页脚：四个页面同一份（原先首页是四列、子页只有两个外链）
const year = new Date().getFullYear()
</script>
