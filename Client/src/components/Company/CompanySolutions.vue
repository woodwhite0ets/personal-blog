<template>
  <div class="co-page">
    <div class="page-wash" aria-hidden="true"></div>
    <header class="co-nav">
      <router-link to="/" class="co-brand" aria-label="OPC 木白 woodwhite">
        <img class="co-brand-symbol" src="/brand/opc-mark-gray.svg" alt="" width="955" height="672" aria-hidden="true" />
        <span class="co-brand-text">
          <span class="co-brand-cn">木白</span>
          <span class="co-brand-en">woodwhite</span>
        </span>
      </router-link>
      <nav class="co-links" aria-label="站内">
        <router-link to="/solutions">方案</router-link>
        <router-link to="/work">案例</router-link>
        <router-link to="/stack">能力</router-link>
        <router-link to="/contact">联系</router-link>
      </nav>
    </header>

    <main class="co-main">
      <!-- 首屏：一句定位 + 三个硬数字 + 两个动作 -->
      <section class="co-hero">
        <div class="co-hero-main">
          <p class="co-kicker">做 AI 应用的后端与检索 · 浙江乐清</p>
          <h1 class="co-title">把 AI 接进你的业务，做到能上线</h1>
          <p class="co-lead">从需求、数据、模型到部署与巡检，一个人跟到底。签合同、可开票、按阶段验收。</p>
          <div class="co-actions">
            <a class="co-btn co-btn-solid" href="mailto:1903784785@qq.com">说说你的项目</a>
            <router-link class="co-btn" to="/work">看 5 个案例</router-link>
          </div>
        </div>
        <aside class="co-hero-facts" aria-label="关键数字">
          <div class="co-fact"><dt>已交付</dt><dd>5 个项目</dd></div>
          <div class="co-fact"><dt>在跑</dt><dd>7×24 自建工作站</dd></div>
          <div class="co-fact"><dt>数据</dt><dd>10 万+ 条在生产</dd></div>
          <div class="co-fact"><dt>响应</dt><dd>一天内</dd></div>
        </aside>
      </section>

      <!-- 一节：能力矩阵，表格化，不写形容词 -->
      <section class="co-sec">
        <h2 class="co-h2">能接的活</h2>
        <table class="mkt-table">
          <thead><tr><th>类型</th><th>典型场景</th><th>交付物</th></tr></thead>
          <tbody>
            <tr><td>知识库与检索</td><td>内部文档问答、客服FAQ、资料检索</td><td>检索服务 + 评测集 + 部署</td></tr>
            <tr><td>模型接入</td><td>业务系统里加对话、抽取、分类</td><td>接口层 + 提示与工具 + 灰度</td></tr>
            <tr><td>本地推理</td><td>数据不能出内网、按次计费太贵</td><td>推理端点 + 监控 + 运维手册</td></tr>
            <tr><td>自动化流程</td><td>采集清洗、定时同步、健康巡检</td><td>任务编排 + 告警 + 运行记录</td></tr>
            <tr><td>全栈业务系统</td><td>带账号权限、后台、报表的站点</td><td>前端 + 接口 + 数据库 + 后台</td></tr>
          </tbody>
        </table>
      </section>

      <!-- 二节：为什么这样交付（对照式，不吹） -->
      <section class="co-sec">
        <h2 class="co-h2">为什么这样交付</h2>
        <div class="mkt-compare">
          <div><h3>常见做法</h3><ul><li>先买一堆 SaaS，接口对不上再改</li><li>模型按次计费，用量一涨成本失控</li><li>数据交给第三方 API</li><li>交付一个演示，上线还要再找人</li></ul></div>
          <div><h3>我的做法</h3><ul><li>先跑通最窄的一条链路，再扩</li><li>自建推理，固定硬件成本</li><li>数据留在自己的机器上</li><li>交付到能上线，含监控与运行手册</li></ul></div>
        </div>
      </section>

      <!-- 三节：怎么开始（流程，四步） -->
      <section class="co-sec">
        <h2 class="co-h2">怎么开始</h2>
        <ol class="mkt-steps">
          <li><span>第 1 步</span><h3>聊一次</h3><p>背景、目标、时间点。不收费，需求不清晰也可以先聊。</p></li>
          <li><span>第 2 步</span><h3>给方案与报价</h3><p>拆成阶段，每段有产物和验收标准，写清不做什么。</p></li>
          <li><span>第 3 步</span><h3>按阶段做</h3><p>每阶段可运行、可验收，改完当天可发。</p></li>
          <li><span>第 4 步</span><h3>交付与接手</h3><p>代码、部署、监控、运行手册，能自己维护。</p></li>
        </ol>
      </section>

      <!-- 四节：合作方式与价格口径 -->
      <section class="co-sec">
        <h2 class="co-h2">合作方式</h2>
        <table class="mkt-table">
          <thead><tr><th>方式</th><th>适合</th><th>怎么算</th></tr></thead>
          <tbody>
            <tr><td>按项目</td><td>需求清楚、边界明确的功能或系统</td><td>按范围报价，分阶段结算</td></tr>
            <tr><td>按月</td><td>已有产品，需要长期迭代或运维</td><td>每周固定投入，月结</td></tr>
            <tr><td>按次诊断</td><td>已有系统出问题或要评估可行性</td><td>单次评估 + 书面结论</td></tr>
          </tbody>
        </table>
        <p class="co-note">价格随范围浮动，聊完给具体数字。签合同、可开票、按阶段验收。</p>
      </section>

      <!-- 收尾 CTA -->
      <section class="co-sec mkt-cta">
        <h2 class="mkt-cta-title">把你的想法说清楚，剩下的我来落地</h2>
        <p class="co-lead">邮件里写清背景、目标和时间预期就行，一般一天内回。</p>
        <a class="co-btn co-btn-solid" href="mailto:1903784785@qq.com">1903784785@qq.com</a>
      </section>
    </main>

    <footer class="co-foot">
      <span>© {{ year }} 木白 woodwhite</span>
      <span class="co-foot-links">
        <router-link to="/HomePage">博客</router-link>
        <a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">GitHub</a>
      </span>
    </footer>
  </div>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
