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
        <router-link to="/projects">案例</router-link>
        <router-link to="/HomePage">博客</router-link>
        <a href="mailto:1903784785@qq.com">联系</a>
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
          <router-link class="co-btn" to="/projects">看案例</router-link>
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

      <!-- ③ 证据 -->
      <section class="co-sec">
        <h2 class="co-h2">做过什么</h2>
        <ul class="co-cases">
          <li v-for="p in cases" :key="p.slug" class="co-case">
            <router-link :to="`/projects/${p.slug}`" class="co-case-link">
              <span class="co-case-head">
                <span class="co-case-name">{{ p.name }}</span>
                <span class="co-case-status">{{ p.status }}</span>
                <time class="co-case-period">{{ p.period }}</time>
              </span>
              <span class="co-case-sub">{{ p.subtitle }}</span>
              <span class="co-case-result">结果：{{ p.result }}</span>
            </router-link>
          </li>
        </ul>
      </section>

      <!-- ④ 合作方式 -->
      <section class="co-sec">
        <h2 class="co-h2">用什么做</h2>
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

        <h2 class="co-h2">怎么合作</h2>
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

      <!-- ⑤ 联系 -->
      <section class="co-sec co-contact">
        <h2 class="co-h2">联系</h2>
        <p class="co-lead">
          邮件里写清背景、目标和时间预期就行；微信适合先把需求聊粗。
        </p>
        <dl class="co-contact-list">
          <div class="co-contact-line">
            <dt>邮箱</dt>
            <dd><a href="mailto:1903784785@qq.com">1903784785@qq.com</a></dd>
          </div>
          <div class="co-contact-line">
            <dt>微信</dt>
            <dd>Woodwhite-0827</dd>
          </div>
          <div class="co-contact-line">
            <dt>GitHub</dt>
            <dd><a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">github.com/woodwhite0ets</a></dd>
          </div>
        </dl>
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

<style scoped>
.co-page {
  position: relative; min-height: 100vh; background-color: var(--bg); color: var(--text);
  /* 公司页的气团：只留极淡的暖色，复用全局 .page-wash 的两层结构 */
  --page-wash-a: rgba(184, 69, 47, .24);
  --page-wash-b: rgba(160, 96, 47, .18);
}

.co-nav { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between;
  gap: 24px; max-width: 1080px; margin: 0 auto; padding: 26px 24px; }
.co-brand { display: flex; align-items: baseline; gap: 10px; text-decoration: none; }
.co-brand-cn { font-family: "Noto Serif SC", var(--font-serif); font-size: 1.5rem; font-weight: 500; letter-spacing: .02em; color: var(--text-bright); }
.co-brand-en { font-family: "EB Garamond Variable", Georgia, serif; font-size: 0.9375rem; color: var(--text-faint); }
.co-links { display: flex; gap: 24px; }
.co-links a { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: .06em; color: var(--text-secondary); text-decoration: none; }
.co-links a:hover { color: var(--text-bright); }
.co-links a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

.co-main { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; padding: 40px 24px 96px; }

.co-hero { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 48px; align-items: end; }
.co-hero-main { min-width: 0; }
.co-hero-facts { margin: 0; padding-left: 8px; border-left: 1px dotted var(--rule-dot-ink); }
.co-fact { display: flex; align-items: baseline; gap: 14px; padding: 9px 0; }
.co-fact dt { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .02em; color: var(--text-faint); width: 44px; flex: none; }
.co-fact dd { margin: 0; font-size: 0.875rem; color: var(--text); }
.co-fact dd a { color: var(--text); text-decoration: none; border-bottom: 1px solid var(--border-strong); }
.co-fact dd a:hover { color: var(--accent); border-color: var(--accent); }
.co-kicker { margin: 0 0 14px; font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .03em; color: var(--text-faint); }
.co-title { margin: 0 0 20px; font-family: "Noto Serif SC", var(--font-serif); font-weight: 500;
  font-size: clamp(2rem, 4.4vw, 3.4rem); line-height: 1.18; letter-spacing: -0.03em; color: var(--text-bright); text-wrap: balance; max-width: 20ch; }
.co-placeholder { color: var(--text-faint); font-style: italic; }
.co-lead { margin: 0; font-size: 1rem; line-height: 1.8; color: var(--text-secondary); max-width: 56ch; text-wrap: pretty; }
.co-actions { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
.co-btn { font-family: var(--font-mono); font-size: 0.8125rem; letter-spacing: .04em; padding: 12px 22px;
  border: 1px solid var(--border-strong); color: var(--text); text-decoration: none; border-radius: 3px;
  transition: color var(--dur-hover) var(--ease-out), border-color var(--dur-hover) var(--ease-out); }
.co-btn:hover { color: var(--text-bright); border-color: var(--text-bright); }
.co-btn-solid { background: var(--text-bright); color: var(--bg); border-color: var(--text-bright); }
.co-btn-solid:hover { background: var(--accent); border-color: var(--accent); color: #fff; }

.co-sec { margin-top: 72px; }

/* 案例列表 */
.co-cases { list-style: none; margin: 0; padding: 0; }
.co-case { border-bottom: 1px dotted var(--rule-dot-ink); }
.co-case:last-child { border-bottom: none; }
.co-case-link { display: block; padding: 16px 4px; text-decoration: none; transition: background-color var(--dur-hover) var(--ease-out); }
.co-case-link:hover { background: var(--overlay-a2); }
.co-case-head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
.co-case-name { font-family: "Noto Serif SC", var(--font-serif); font-size: 1.0625rem; font-weight: 500; color: var(--text-bright); }
.co-case-status { font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .04em; color: var(--text-faint); border: 1px solid var(--border-strong); border-radius: 3px; padding: 1px 6px; }
.co-case-period { margin-left: auto; font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-faint); }
.co-case-sub { display: block; margin-top: 4px; font-size: 0.875rem; line-height: 1.6; color: var(--text-secondary); }
.co-case-result { display: block; margin-top: 6px; font-family: var(--font-mono); font-size: 0.6875rem; line-height: 1.6; color: var(--text-faint); }

/* 工作站 */
.co-infra-lead { margin: 0 0 20px; font-size: 0.9375rem; line-height: 1.8; color: var(--text-secondary); max-width: 62ch; }
.co-infra-facts { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: var(--rule-dot-ink); border: 1px dotted var(--rule-dot-ink); }
.co-infra-facts > div { background: var(--bg); padding: 16px 18px; }
.co-infra-facts dt { font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .06em; color: var(--text-faint); margin-bottom: 6px; }
.co-infra-facts dd { margin: 0; font-size: 0.875rem; line-height: 1.65; color: var(--text); }
@media (max-width: 700px) { .co-infra-facts { grid-template-columns: 1fr; } }
.co-h2 { display: flex; align-items: baseline; gap: 12px; margin: 0 0 26px; padding-bottom: 10px;
  border-bottom: 1px dotted var(--rule-dot-ink);
  font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600; letter-spacing: .02em; color: var(--text-secondary); }
.co-idx { color: var(--text-faint); font-weight: 400; }

.co-grid { display: grid; gap: 1px; background: var(--rule-dot-ink); border: 1px dotted var(--rule-dot-ink); }
.co-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.co-grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.co-card { background-color: var(--bg); padding: 24px 22px 26px; display: flex; flex-direction: column; }
/* 服务卡的底色由 style.css 的统一水彩规则给，这里不单独设色 */
.co-card h3 { margin: 0 0 10px; font-family: "Noto Serif SC", var(--font-serif); font-size: 1.125rem; font-weight: 500; color: var(--text-bright); }
.co-card p { margin: 0; font-size: 0.875rem; line-height: 1.75; color: var(--text-secondary); }
.co-meta { margin-top: auto !important; padding-top: 18px; font-family: var(--font-mono); font-size: 0.6875rem !important; letter-spacing: .04em; color: var(--text-faint) !important; }

.co-proof { list-style: none; margin: 0; padding: 0; }
.co-proof li { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 20px; padding: 16px 0;
  border-bottom: 1px dotted var(--rule-dot-ink); align-items: baseline; }
.co-proof-k { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .06em; color: var(--text-faint); }
.co-proof-v { font-size: 0.9375rem; line-height: 1.7; color: var(--text); }

.co-note { margin: 22px 0 0; font-size: 0.8125rem; color: var(--text-faint); }

.co-contact { padding-top: 8px; }
.co-contact-list { margin: 26px 0 0; }
.co-contact-line { display: flex; align-items: baseline; gap: 20px; padding: 13px 0;
  border-bottom: 1px dotted var(--rule-dot-ink); }
.co-contact-line:last-child { border-bottom: none; }
.co-contact-line dt { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .02em;
  color: var(--text-faint); width: 72px; flex-shrink: 0; }
.co-contact-line dd { margin: 0; font-size: 1rem; color: var(--text); }
.co-contact-line a { color: var(--text-bright); text-decoration: none; border-bottom: 1px solid var(--border-strong); }
.co-contact-line a:hover { color: var(--accent); border-color: var(--accent); }

.co-foot { position: relative; z-index: 1; max-width: 1080px; margin: 0 auto; padding: 28px 24px 40px;
  display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
  border-top: 1px dotted var(--rule-dot-ink);
  font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .04em; color: var(--text-faint); }
.co-foot-links { display: flex; gap: 18px; }
.co-foot-links a { color: var(--text-faint); text-decoration: none; }
.co-foot-links a:hover { color: var(--text-bright); }

@media (max-width: 900px) {
  .co-hero { grid-template-columns: 1fr; gap: 32px; align-items: start; }
  .co-hero-facts { border-left: none; border-top: 1px dotted var(--rule-dot-ink); padding-left: 0; padding-top: 8px; }
}
@media (max-width: 820px) {
  .co-grid-3, .co-grid-2 { grid-template-columns: 1fr; }
  .co-proof li { grid-template-columns: 1fr; gap: 4px; }
  .co-sec { margin-top: 64px; }
}
</style>
