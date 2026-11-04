<template>
  <div class="co-page">
    <div class="page-wash" aria-hidden="true"></div>

    <!-- 极简顶栏：公司页不挂博客导航 -->
    <header class="co-nav">
      <router-link to="/" class="co-brand" aria-label="OPC 木白 woodwhite">
        <img class="co-brand-symbol" src="/brand/opc-mark.svg" alt="" width="955" height="672" aria-hidden="true" />
        <span class="co-brand-text">
          <span class="co-brand-cn">木白</span>
          <span class="co-brand-en">woodwhite</span>
        </span>
      </router-link>
      <nav class="co-links" aria-label="站内">
        <router-link to="/work">案例</router-link>
        <router-link to="/stack">能力</router-link>
        <router-link to="/contact">联系</router-link>
        <router-link to="/HomePage">博客</router-link>
      </nav>
    </header>

    <main class="co-main">
      <!-- ① 定位 -->
      <section class="co-hero">
        <div class="co-hero-main">
        <p class="co-kicker">浙江乐清，可开票，按合同交付</p>
        <h1 class="co-title">
          <!-- TODO(博士)：把这一句换成真实定位。要求：给谁、解决什么问题、可验收 -->
          协助你做出期待的产品
        </h1>
        <p class="co-lead">
          从需求到上线：AI 应用的后端与检索、本地推理与自动化、全栈实现。
        </p>
        <div class="co-actions">
          <a class="co-btn co-btn-solid" href="mailto:1903784785@qq.com">说说你的项目</a>
          <router-link class="co-btn" to="/work">看案例</router-link>
        </div>
        </div>

        <aside class="co-hero-facts" aria-label="基本情况">
          <div class="co-fact"><dt>地点</dt><dd>浙江乐清</dd></div>
          <div class="co-fact"><dt>结算</dt><dd>可开票</dd></div>
          <div class="co-fact"><dt>交付</dt><dd>签合同，按阶段验收</dd></div>
          <div class="co-fact"><dt>案例</dt><dd><router-link to="/projects">5 个已上线项目</router-link></dd></div>
        </aside>
      </section>

      <!-- ② 做什么：六个并列小节，两列，不用卡片 -->
      <section class="co-sec">
        <h2 class="co-h2">做什么</h2>
        <ul class="co-caps">
          <li><h3>RAG 与向量检索</h3><p>把文档变成能查的知识库，带重排与评测。</p></li>
          <li><h3>提示与工具编排</h3><p>多步任务的流程编排，失败可重试、可回放。</p></li>
          <li><h3>评测与灰度</h3><p>上线前先量化效果，按比例放量，出问题能退回。</p></li>
          <li><h3>本地推理</h3><p>自带机器跑模型，不按次计费，数据不出内网。</p></li>
          <li><h3>定时任务与巡检</h3><p>采集、清洗、同步、健康检查自己跑，出异常告警。</p></li>
          <li><h3>全栈实现</h3><p>Vue / Node / MySQL 的业务系统，含认证、权限与后台。</p></li>
        </ul>
      </section>

      <!-- ③ 为什么是这种方式 -->
      <section class="co-sec">
        <h2 class="co-h2">为什么是这种方式</h2>
        <ul class="co-why">
          <li><span class="co-why-k">不用买算力</span><span class="co-why-v">模型跑在自己机器上，少一层按次计费的账单，也少一个外部依赖。</span></li>
          <li><span class="co-why-k">数据不出内网</span><span class="co-why-v">检索与推理都在本地，敏感资料不必交给第三方 API。</span></li>
          <li><span class="co-why-k">交付可验收</span><span class="co-why-v">每个阶段有明确产物和验收标准，签合同按阶段结。</span></li>
          <li><span class="co-why-k">改动当天上线</span><span class="co-why-v">自建 Git 与 CI，不用排队等额度，改完就能发。</span></li>
        </ul>
      </section>

      <!-- ③ 一条精选案例 + 去哪看更多 -->
      <section class="co-sec">
        <h2 class="co-h2">最近交付</h2>
        <router-link :to="`/projects/${featured.slug}`" class="co-feature">
          <span class="co-feature-name">{{ featured.name }}</span>
          <span class="co-feature-sub">{{ featured.subtitle }}</span>
          <span class="co-feature-result">结果：{{ featured.result }}</span>
          <span class="co-feature-more">看这个案例的做法 →</span>
        </router-link>
        <p class="co-note">
          另外 {{ cases.length - 1 }} 个在跑的项目，
          <router-link to="/work">在案例页</router-link>；
          基础设施与交付方式在<router-link to="/stack">能力页</router-link>。
        </p>
      </section>

      <!-- ④ 运行事实：一条窄带 -->
      <section class="co-sec">
        <h2 class="co-h2">现在的状态</h2>
        <div class="status-band">
          <span class="sb-item"><span class="sb-k">已交付</span><span class="sb-v">{{ cases.length }} 个项目</span></span>
          <span class="sb-item"><span class="sb-k">工作站</span><span class="sb-v">7×24 运行</span></span>
          <span class="sb-item"><span class="sb-k">工具库</span><span class="sb-v">560 条</span></span>
          <span class="sb-item"><span class="sb-k">响应</span><span class="sb-v">一天内</span></span>
        </div>
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
import { projects } from '../../data/projects.js'

const cases = projects
const featured = projects[0]
const year = new Date().getFullYear()
</script>


