<template>
  <footer class="co-foot">
    <div class="dk-bg dk-bg--tail" aria-hidden="true"><DeckFigure name="tail" /></div>
    <!-- 活页模式的封底：首页一屏一页，页脚单独占最后一屏，这里给它一点内容，
         否则最后一页只剩大片空白（这块在长页里不显示，见 company.css） -->
    <div class="co-foot-end">
      <p class="co-foot-end-k">END OF SHEET · 06 / 06</p>
      <p class="co-foot-end-t">木白 woodwhite</p>
      <p class="co-foot-end-note">木白（厦门）智能软件科技有限公司 · 厦门市翔安区</p>
    </div>

    <div class="co-foot-cols">
      <div class="co-foot-brand">
        <span class="co-foot-id">
          <img class="co-foot-mark" src="/brand/opc-mark-gray.svg" alt="" width="955" height="672" aria-hidden="true" />
          <span class="co-foot-name">木白 woodwhite</span>
        </span>
        <p>给已经在跑的业务加 AI 能力，一个人从头做到上线后的巡检。</p>
        <span class="co-foot-copy">© {{ year }} 木白 woodwhite</span>
        <!-- 备案号：境内托管的形式义务，与博客同域同主体；改备案后两处要一起改 -->
        <p class="co-foot-beian">
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">浙ICP备2026059663号-1</a>
          <span aria-hidden="true">·</span>
          <a href="https://beian.mps.gov.cn/#/query/webSearch?code=33038202005059" target="_blank" rel="noopener noreferrer">浙公网安备33038202005059号</a>
        </p>
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
        <router-link to="/privacy">隐私政策</router-link>
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
import DeckFigure from './DeckFigure.vue'

// 公司站页脚：四个页面同一份（原先首页是四列、子页只有两个外链）
const year = new Date().getFullYear()
</script>
