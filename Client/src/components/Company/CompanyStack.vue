<template>
  <div class="co-page">
    <div class="page-wash" aria-hidden="true"></div>
    <header class="co-nav">
      <router-link to="/" class="co-brand" aria-label="OPC 木白 woodwhite">
        <img class="co-brand-symbol" src="/brand/opc-mark-color.svg" alt="" width="955" height="672" aria-hidden="true" />
        <span class="co-brand-text">
          <span class="co-brand-cn">木白</span>
          <span class="co-brand-en">woodwhite</span>
        </span>
      </router-link>
      <nav class="co-links" aria-label="站内">
        <router-link to="/work">案例</router-link>
        <router-link to="/stack">能力</router-link>
        <router-link to="/contact">联系</router-link>
        <router-link to="/blog">博客</router-link>
      </nav>
    </header>

    <main class="co-main">
      <section class="co-sec" style="margin-top: 8px">
        <h1 class="co-page-title">能力与基础设施</h1>
        <p class="co-lead">不外包算力，也不把数据交出去：所有东西跑在自己的一台机器上。</p>
      </section>
      <section class="co-sec">
        <div class="co-infra">
          <p class="co-infra-lead">
            自己的机器，自己的链路：一台旧服务器上自托管模型、检索、CI 与知识库，7×24 在跑。
            不需要向第三方买算力，也不把数据交出去。
          </p>
          <dl class="co-infra-facts">
            <div><dt>算力</dt><dd>24 核 / 62G / NVMe+1.8T，本地推理三实例</dd></div>
            <div><dt>检索</dt><dd>pgvector + 重排，知识库按项目分目录</dd></div>
            <div><dt>交付链</dt><dd>自建 Git 与 CI，systemd 定时巡检与同步</dd></div>
            <div><dt>暴露面</dt><dd>零入站端口，对外只走出站隧道</dd></div>
          </dl>
        </div>
      </section>

      <section class="co-sec">
        <h2 class="co-h2">这套东西能带来什么</h2>
        <ul class="co-proof">
          <li><span class="co-proof-k">交付速度</span><span class="co-proof-v">依赖本地模型与自建 CI，不用等第三方额度，改动当天能上线。</span></li>
          <li><span class="co-proof-k">数据边界</span><span class="co-proof-v">模型与检索都在自己机器上，敏感数据不出内网。</span></li>
          <li><span class="co-proof-k">成本</span><span class="co-proof-v">固定硬件成本，没有按次计费的推理账单。</span></li>
        </ul>
      </section>

    </main>

    <footer class="co-foot">
      <span>© {{ year }} 木白 woodwhite</span>
      <span class="co-foot-links">
        <router-link to="/blog">博客</router-link>
        <a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">GitHub</a>
      </span>
    </footer>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
