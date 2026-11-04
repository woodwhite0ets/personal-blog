<template>
  <div class="co-page">
    <div class="page-wash" aria-hidden="true"></div>

    <!-- 极简顶栏：公司页不挂博客导航 -->
    <header class="co-nav">
      <router-link to="/" class="co-brand">
        <span class="co-brand-cn">木白</span>
        <span class="co-brand-en">woodwhite</span>
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

      <!-- ② 服务 -->
      <section class="co-sec">
        <h2 class="co-h2">做什么</h2>
        <div class="co-grid co-grid-3">
          <article class="co-card">
            <h3>AI 应用后端与检索</h3>
            <p>RAG、向量检索、提示与工具编排，带评测和灰度发布。</p>
            <p class="co-meta">交付：接口、数据管道、部署</p>
          </article>
          <article class="co-card">
            <h3>本地推理与自动化</h3>
            <p>本地模型、推理服务、定时任务与巡检。</p>
            <p class="co-meta">交付：可用端点、监控、运行手册</p>
          </article>
          <article class="co-card">
            <h3>全栈实现</h3>
            <p>Vue、Node、MySQL 的业务系统，含认证、权限、后台。</p>
            <p class="co-meta">交付：可上线站点、管理端</p>
          </article>
        </div>
      </section>

      <!-- 入口：分成三个子页，首页不再长 -->
      <section class="co-sec">
        <div class="co-grid co-grid-3">
          <router-link class="co-card co-entry" to="/work">
            <h3>案例</h3>
            <p>五个已上线的项目，每条写清问题、做法与结果。</p>
            <span class="co-entry-more">看案例</span>
          </router-link>
          <router-link class="co-card co-entry" to="/stack">
            <h3>用什么做</h3>
            <p>自建的工作站：本地推理、检索、CI 与巡检，零入站端口。</p>
            <span class="co-entry-more">看基础设施</span>
          </router-link>
          <router-link class="co-card co-entry" to="/contact">
            <h3>怎么合作</h3>
            <p>按项目或按月，签合同可开票，先聊需求再报价。</p>
            <span class="co-entry-more">聊一聊</span>
          </router-link>
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

const cases = projects.slice(0, 5)
const year = new Date().getFullYear()
</script>


