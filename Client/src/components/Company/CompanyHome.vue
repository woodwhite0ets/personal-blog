<template>
  <div class="co-page">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav variant="company" />

    <!-- 首屏：与博客同一套「印在纸上的画」背景 + 左文 + 右交付清单 -->
    <section class="hero-band co-hero-band">
        <HeroBackdrop session-key="company-hero-art" :art-count="5" />
        <div class="hero-in co-hero-in">
        <div class="co-hero-main">
          <p class="co-badge"><span class="co-badge-dot" aria-hidden="true"></span>浙江乐清 · 可开票 · 一天内回信</p>
          <h1 class="co-title">把 AI 接进你的业务，<br /><span class="co-title-key">做到能上线</span></h1>
          <p class="co-lead">从需求、数据、模型到部署与巡检，一个人跟到底。签合同、按阶段验收、可开票。</p>
          <div class="co-actions">
            <a class="co-btn co-btn-solid" href="mailto:1903784785@qq.com">说说你的项目</a>
            <router-link class="co-btn" to="/work">看 5 个案例</router-link>
          </div>
          <ul class="co-stack-strip" aria-label="在用的技术">
            <li>Vue 3</li><li>Node.js</li><li>MySQL</li><li>向量检索</li><li>自建推理</li>
          </ul>
        </div>

        <aside class="co-aside" aria-label="交付清单">
          <div class="co-aside-block">
            <p class="co-aside-head">交付清单 · 一次项目</p>
            <ul class="co-aside-list">
              <li><span class="co-aside-k">代码</span><span class="co-aside-v">含提交历史</span></li>
              <li><span class="co-aside-k">部署</span><span class="co-aside-v">脚本 + 回滚步骤</span></li>
              <li><span class="co-aside-k">监控</span><span class="co-aside-v">告警与巡检</span></li>
              <li><span class="co-aside-k">文档</span><span class="co-aside-v">运行手册</span></li>
            </ul>
            <p class="co-aside-foot">随项目移交，不锁在你手里</p>
            <router-link class="co-aside-more" to="/work">全部案例</router-link>
          </div>

          <!-- 交付路径：一条线四个节点（占博客右栏雷达图那个位置） -->
          <figure class="co-aside-fig">
            <svg viewBox="0 0 300 86" aria-hidden="true" focusable="false">
              <line x1="14" y1="40" x2="286" y2="40" class="fig-line" />
              <circle cx="14" cy="40" r="3" class="fig-dot" />
              <circle cx="104" cy="40" r="3" class="fig-dot" />
              <circle cx="196" cy="40" r="3" class="fig-dot" />
              <circle cx="286" cy="40" r="4.5" class="fig-dot-key" />
              <text x="14" y="66" class="fig-t">需求</text>
              <text x="104" y="66" class="fig-t">数据</text>
              <text x="196" y="66" class="fig-t">模型</text>
              <text x="286" y="66" class="fig-t" text-anchor="end">上线</text>
            </svg>
          </figure>
        </aside>
        </div>
    </section>

    <main class="co-main">
      <!-- 指标带 -->
      <section class="co-metrics" aria-label="关键数字" ref="metricsRef">
        <div class="co-metric" v-for="(m, i) in metrics" :key="m.label">
          <span class="co-metric-v">{{ shown[i] }}{{ m.suffix }}</span>
          <span class="co-metric-k">{{ m.label }}</span>
        </div>
      </section>

      <!-- 01 能接的活 -->
      <section id="scope" class="co-sec">
        <h2 class="co-h2"><span class="co-h2-t">能接的活</span><span class="co-h2-rule" aria-hidden="true"></span><span class="co-h2-note">SCOPE</span></h2>
        <div class="co-cards">
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>知识库与检索</h3>
            <p>内部文档问答、客服 FAQ、资料检索。</p>
            <p class="co-svc-fit">适合：文档已经有几百页以上、客服答复需要给出处，现在靠人翻或靠一个通用大模型硬猜。</p>
            <p class="co-svc-meta">交付 · 检索服务 + 评测集 + 部署</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>模型接入</h3>
            <p>业务系统里加对话、抽取、分类。</p>
            <p class="co-svc-fit">适合：系统已经在跑，想加 AI 能力但不想重做架构；预算按量浮动、需要能随时切模型。</p>
            <p class="co-svc-meta">交付 · 接口层 + 提示与工具 + 灰度</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>本地推理</h3>
            <p>数据不能出内网，或者按次计费太贵。</p>
            <p class="co-svc-meta">交付 · 推理端点 + 监控 + 运维手册</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>自动化流程</h3>
            <p>采集清洗、定时同步、健康巡检。</p>
            <p class="co-svc-meta">交付 · 任务编排 + 告警 + 运行记录</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>全栈业务系统</h3>
            <p>带账号权限、后台、报表的站点。</p>
            <p class="co-svc-meta">交付 · 前端 + 接口 + 数据库 + 后台</p>
          </div></article>
          <article class="co-svc co-svc-cta"><div class="co-svc-in paper-field">
            <h3>不确定属于哪一类？</h3>
            <p>把背景和目标发我，先判断值不值得做。</p>
            <a class="co-svc-link" href="mailto:1903784785@qq.com">写信描述需求</a>
          </div></article>
        </div>
      </section>

      <!-- 02 交付标准 -->
      <section id="standard" class="co-sec">
        <h2 class="co-h2"><span class="co-h2-t">三项交付标准</span><span class="co-h2-rule" aria-hidden="true"></span><span class="co-h2-note">STANDARD</span></h2>
        <p class="co-sec-lead">每个项目都按这三条验收，写进合同，不是口头承诺。</p>
        <div class="co-standards">
          <div class="co-std">
            <span class="co-std-k">可运行 · RUNNABLE</span>
            <span class="co-std-v">有地址</span>
            <p>每次交付都是一个能打开的地址，不是一段演示视频。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">可验收 · ACCEPTABLE</span>
            <span class="co-std-v">有产物</span>
            <p>每阶段有产物清单与验收标准，也写清这次不做什么。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">可接手 · HANDOVER</span>
            <span class="co-std-v">有手册</span>
            <p>代码、部署脚本、监控与运行手册一起交，能自己维护。</p>
          </div>
        </div>
      </section>

      <!-- 案例证据 -->
      <section id="proof" class="co-sec">
        <h2 class="co-h2"><span class="co-h2-t">做过的几个</span><span class="co-h2-rule" aria-hidden="true"></span><span class="co-h2-note">PROOF</span></h2>
        <ul class="co-proof-list">
          <li v-for="c in proofCases" :key="c.slug">
            <router-link :to="`/projects/${c.slug}`" class="co-proof-row">
              <span class="co-proof-name">{{ c.name }}</span>
              <span class="co-proof-sub">{{ c.subtitle }}</span>
              <span class="co-proof-result">{{ c.result }}</span>
              <time class="co-proof-period">{{ c.period }}</time>
            </router-link>
          </li>
        </ul>
        <p class="co-note">共 5 个已上线项目，每个都写清问题、做法与结果。<router-link to="/work" class="co-note-link">全部案例</router-link></p>
      </section>

      <!-- 03 为什么这样交付 -->
      <section class="co-sec">
        <h2 class="co-h2"><span class="co-h2-t">为什么这样交付</span><span class="co-h2-rule" aria-hidden="true"></span><span class="co-h2-note">WHY</span></h2>
        <div class="mkt-compare">
          <div class="paper-field"><h3>常见做法</h3><ul><li>先买一堆 SaaS，接口对不上再改</li><li>模型按次计费，用量一涨成本失控</li><li>数据交给第三方 API</li><li>交付一个演示，上线还要再找人</li></ul></div>
          <div class="paper-field"><h3>我的做法</h3><ul><li>先跑通最窄的一条链路，再扩</li><li>自建推理，固定硬件成本</li><li>数据留在自己的机器上</li><li>交付到能上线，含监控与运行手册</li></ul></div>
        </div>
      </section>

      <!-- 04 怎么开始 -->
      <section class="co-sec">
        <h2 class="co-h2"><span class="co-h2-t">怎么开始</span><span class="co-h2-rule" aria-hidden="true"></span><span class="co-h2-note">PROCESS</span></h2>
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>聊一次</h3><p>背景、目标、时间点。不收费，需求不清晰也可以先聊。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>给方案与报价</h3><p>拆成阶段，每段有产物和验收标准，写清不做什么。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>按阶段做</h3><p>每阶段可运行、可验收，改完当天可发。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>交付与接手</h3><p>代码、部署、监控、运行手册，能自己维护。</p></li>
        </ol>
      </section>

      <!-- 05 合作方式 -->
      <section id="pricing" class="co-sec">
        <h2 class="co-h2"><span class="co-h2-t">合作方式</span><span class="co-h2-rule" aria-hidden="true"></span><span class="co-h2-note">TERMS</span></h2>
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

      <!-- 06 常见问题 -->
      <section id="faq" class="co-sec">
        <h2 class="co-h2"><span class="co-h2-t">常见问题</span><span class="co-h2-rule" aria-hidden="true"></span><span class="co-h2-note">FAQ</span></h2>
        <div class="co-faq">
          <details class="co-faq-item" open>
            <summary>报价怎么算？</summary>
            <p>按范围拆阶段算。聊完给具体数字，写进合同；不做「先低价试水再加价」那套。</p>
          </details>
          <details class="co-faq-item">
            <summary>我的数据会不会外传？</summary>
            <p>默认留在你指定的机器上。确实需要接外部模型接口时，会提前写清哪一段数据出网、出到哪家。</p>
          </details>
          <details class="co-faq-item">
            <summary>交付后我自己能维护吗？</summary>
            <p>能。代码、部署脚本、监控配置和运行手册一起移交，交付后两周内答疑；之后按次或按月都行。</p>
          </details>
          <details class="co-faq-item">
            <summary>多快能开始？</summary>
            <p>一般一周内能排上；着急的按次诊断通常一两天内给结论。先聊一次判断值不值得做，不收费。</p>
          </details>
          <details class="co-faq-item">
            <summary>什么情况我不接？</summary>
            <p>只要演示不要上线、预算与范围明显不匹配、或者要我把合规责任一并兜住的项目，我会直说做不了。</p>
          </details>
        </div>
      </section>

      <!-- CTA -->
      <section class="co-cta paper-field">
        <div class="co-cta-in">
          <h2 class="co-cta-title">把你的想法说清楚，剩下的我来落地</h2>
          <p class="co-cta-lead">邮件里写清背景、目标和时间预期就行，一般一天内回。</p>
          <!-- 联系方式直接摆出来，不做成按钮 -->
          <p class="co-cta-mail"><a href="mailto:1903784785@qq.com">1903784785@qq.com</a></p>
          <p class="co-note">签合同 · 可开票 · 按阶段验收 · 数据可留在自己机器上</p>
        </div>
      </section>
    </main>

    <footer class="co-foot">
      <div class="co-foot-cols">
        <div class="co-foot-brand">
          <span class="co-foot-name">木白 woodwhite</span>
          <p>把 AI 接进业务，做到能上线。一个人从头跟到尾。</p>
          <span class="co-foot-copy">© {{ year }} 木白 woodwhite</span>
        </div>
        <nav class="co-foot-col" aria-label="服务">
          <h3>服务</h3>
          <a href="#scope">能接的活</a>
          <a href="#standard">交付标准</a>
          <a href="#pricing">合作方式</a>
          <a href="#faq">常见问题</a>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import HeroBackdrop from '../common/HeroBackdrop.vue'
import SiteNav from '../common/SiteNav.vue'
import { projects } from '../../data/projects.js'

// 首页只放三条证据，其余去 /work
const proofCases = projects.slice(0, 3)

const year = new Date().getFullYear()

// ====== 指标带：进入视口时从 0 滚到目标值 ======
const metrics = [
  { value: 5, suffix: '', label: '已交付项目' },
  { value: 10, suffix: ' 万+', label: '生产环境数据条数' },
  { value: 7, suffix: '×24', label: '自建工作站在线' },
  { value: 1, suffix: ' 天', label: '首次回信' },
]
const shown = ref(metrics.map(() => 0))
const metricsRef = ref(null)
let io = null
let raf = 0

const settle = () => { shown.value = metrics.map((m) => m.value) }

function runCountUp(duration = 1100) {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (calm) { settle(); return }
  const t0 = performance.now()
  const tick = (now) => {
    // rAF 的时间戳可能略早于调度时取的 performance.now()，p 必须夹在 [0,1]，否则会算出负数
    const p = Math.min(1, Math.max(0, (now - t0) / duration))
    const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
    shown.value = metrics.map((m) => Math.round(m.value * eased))
    if (p < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  // 兜底：rAF 被节流（后台标签页 / 省电模式）时，动画可能停在 0，到点直接落定终值
  window.setTimeout(settle, duration + 260)
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') { runCountUp(); return }
  io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      runCountUp()
      io.disconnect()
      io = null
    }
  }, { threshold: 0.4 })
  if (metricsRef.value) io.observe(metricsRef.value)
  else runCountUp()
})

onUnmounted(() => {
  if (io) io.disconnect()
  if (raf) cancelAnimationFrame(raf)
})
</script>

<style scoped>
/* ===== 首屏：直接吃博客那套 hero-band（背景画 + 暗角 + 点阵 + 光标光晕） ===== */
.co-page { overflow-x: clip; }
.co-hero-band { border-bottom: none; }
/* 公司页文案字号比博客小，画的浓度压一档，别让背景抢正文 */
/* 首屏跟博客同一个做法：画铺满整个首屏带，内容压在画上。
   首屏带高度由全局 .hero-band（min(70dvh, 600px)）控制，比博客整屏矮一档。 */
.co-hero-band :deep(.hero-art) { --wash-blur: 34px; }
.co-hero-in {
  max-width: 1080px; margin: 0 auto;
  grid-template-columns: minmax(0, 1fr) minmax(0, 340px);
  gap: 64px; align-items: center;
  padding: 48px 24px 44px;
}
/* 首屏字号跟博客一个量级：标题顶到 4.2rem，行高收紧 */
.co-hero-in .co-title {
  font-size: clamp(2.5rem, 6vw, 5rem); line-height: 1.08;
  letter-spacing: -0.042em; max-width: 18ch; font-weight: 500;
  text-wrap: balance;
}
/* 整句话里只让一个短语变色：其余靠字号和字距 */
.co-title-key { color: var(--accent); }
.co-hero-in .co-lead { margin-top: 4px; max-width: 46ch; }
.co-hero-in .co-badge { margin-bottom: 20px; }
.co-hero-main, .co-aside { position: relative; z-index: 1; }
/* 整块进入一次就够：逐项错峰在弱网/低帧率下会让按钮看起来"没渲染出来" */
.co-hero-main { animation: coRise .8s cubic-bezier(.16, 1, .3, 1) both; }
@keyframes coRise {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .co-hero-main { animation: none; }
}


/* ===== 首屏徽标 ===== */
.co-badge {
  display: inline-flex; align-items: center; gap: 8px; margin: 0 0 16px;
  padding: 5px 11px; border: 1px solid var(--border-strong); border-radius: 999px;
  font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .02em;
  color: var(--text-secondary); background: color-mix(in srgb, #fff 60%, transparent);
}
.co-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex: none; }

.co-stack-strip { list-style: none; margin: 26px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 14px; }
.co-stack-strip li {
  font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .04em;
  color: var(--text-secondary); padding-right: 14px; border-right: 1px solid var(--border-strong);
}
.co-stack-strip li:last-child { border-right: none; padding-right: 0; }

/* ===== 首屏右栏：跟博客右栏同一个骨架（裸清单 + 一张小图） ===== */
.co-aside { display: flex; flex-direction: column; gap: 36px; align-self: end; min-width: 0; }
.co-aside-head {
  margin: 0 0 10px; font-family: var(--font-mono); font-size: 0.6875rem;
  letter-spacing: .1em; color: var(--text-secondary);
}
.co-aside-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border-strong); }
.co-aside-list li {
  display: flex; align-items: baseline; padding: 12px 0;
  border-bottom: 1px dotted var(--rule-dot-ink);
}
/* 键吃掉剩余宽度，点线自动铺满中间；值靠右 */
.co-aside-k {
  display: flex; align-items: baseline; flex: 1; min-width: 0;
  font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-dim);
}
.co-aside-k::after {
  content: ""; flex: 1; height: 1px; margin: 0 10px; align-self: center;
  background-image: radial-gradient(circle, color-mix(in srgb, var(--text) 26%, transparent) .8px, transparent 1.1px);
  background-size: 5px 2px; background-repeat: repeat-x;
}
.co-aside-v { flex: none; font-size: 0.875rem; color: var(--text-bright); }
.co-aside-foot {
  margin: 12px 0 0; font-family: var(--font-mono); font-size: 0.625rem;
  letter-spacing: .03em; color: var(--text-secondary);
}
.co-aside-more {
  display: inline-block; margin-top: 12px; font-family: var(--font-mono); font-size: 0.6875rem;
  color: var(--accent); text-decoration: none; padding-bottom: 1px;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
}
.co-aside-more:hover { border-color: var(--accent); }
.co-aside-more:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

.co-aside-fig { margin: 0; }
.co-aside-fig svg { width: 100%; height: auto; overflow: visible; }
.fig-line {
  stroke: color-mix(in srgb, var(--text) 20%, transparent); stroke-width: .8;
  stroke-dasharray: 272; stroke-dashoffset: 272;
}
.fig-dot { fill: var(--bg); stroke: color-mix(in srgb, var(--text) 42%, transparent); stroke-width: 1; }
.fig-dot-key { fill: var(--accent); }

/* 路径随进入视口画出来，四个节点跟着依次亮起（整页只有这一处"叙述型"动画） */
@supports (animation-timeline: view()) {
  .fig-line {
    animation: figDraw linear both;
    animation-timeline: view();
    animation-range: entry 24% entry 62%;
  }
  .fig-dot, .fig-dot-key {
    animation: figNode linear both;
    animation-timeline: view();
  }
  .co-aside-fig circle:nth-of-type(1) { animation-range: entry 26% entry 44%; }
  .co-aside-fig circle:nth-of-type(2) { animation-range: entry 34% entry 52%; }
  .co-aside-fig circle:nth-of-type(3) { animation-range: entry 42% entry 60%; }
  .co-aside-fig circle:nth-of-type(4) { animation-range: entry 50% entry 68%; }
  .co-aside-fig text { animation: figNode linear both; animation-timeline: view(); animation-range: entry 46% entry 76%; }
}
@keyframes figDraw { from { stroke-dashoffset: 272; } to { stroke-dashoffset: 0; } }
@keyframes figNode { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .fig-line { animation: none; stroke-dashoffset: 0; }
  .fig-dot, .fig-dot-key, .co-aside-fig text { animation: none; opacity: 1; }
}
.fig-t { font-family: var(--font-mono); font-size: 8px; letter-spacing: .14em; fill: var(--text-faint); }

/* ===== 指标带 ===== */
.co-metrics {
  margin-top: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--border-strong); border-bottom: 1px solid var(--border-strong);
}
.co-metric { padding: 22px 20px 20px; border-right: 1px dotted var(--rule-dot-ink); display: flex; flex-direction: column; gap: 6px; }
.co-metric:last-child { border-right: none; }
.co-metric-v { font-family: "Noto Serif SC", var(--font-serif); font-size: clamp(1.75rem, 2.8vw, 2.3rem); line-height: 1.1; color: var(--accent); letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.co-metric-k { font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .08em; color: var(--text-faint); }

/* 公司站统一到品牌冷蓝：全局那套暖奶油卡只留给博客/赤陶语系，
   否则一张杏色表格插在蓝页里会自己变成一个强调色。 */
/* ===== 章节引导句 ===== */
.co-sec-lead { margin: -12px 0 22px; font-size: 0.875rem; line-height: 1.7; color: var(--text-secondary); max-width: 62ch; }
/* 章节头：大衬线标题 + 拉到右端的细线 + 小注记。
   不用"每个标题上方都摆一个全大写小标签"那套模板做法。 */
.co-h2 {
  display: flex; align-items: baseline; gap: 16px; margin: 0 0 26px;
  font-family: "Noto Serif SC", var(--font-serif);
  font-size: clamp(1.75rem, 2.6vw, 2.35rem); font-weight: 600;
  letter-spacing: -0.025em; color: var(--text-bright);
}
.co-h2-t { white-space: nowrap; }
.co-h2-rule { flex: 1; height: 1px; background: var(--border); transform-origin: left; }
@supports (animation-timeline: view()) {
  .co-h2-rule {
    animation: coRuleDraw linear both;
    animation-timeline: view();
    animation-range: entry 12% entry 48%;
  }
}
@keyframes coRuleDraw {
  from { transform: translateY(-6px) scaleX(0); }
  to   { transform: translateY(-6px) scaleX(1); }
}
@media (prefers-reduced-motion: reduce) { .co-h2-rule { animation: none; transform: translateY(-6px); } }
.co-h2-note {
  font-family: var(--font-mono); font-size: 0.625rem; font-weight: 400;
  letter-spacing: .16em; color: var(--text-faint); white-space: nowrap;
}

/* ===== 能接的活：卡片 ===== */
/* 非对称 bento：两张 3/6 大格 + 三张 2/6 中格 + 一张通栏收口 */
.co-cards { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
.co-svc:nth-child(1), .co-svc:nth-child(2) { grid-column: span 3; }
.co-svc:nth-child(3), .co-svc:nth-child(4), .co-svc:nth-child(5) { grid-column: span 2; }
.co-svc-cta { grid-column: span 6; }

/* Double-bezel：外壳（描边 + 4px 内衬）套内芯，同心圆角，像嵌进托盘里 */
.co-svc {
  display: flex; min-width: 0;
  padding: 4px; border: 1px solid var(--border-strong); border-radius: 10px;
  background: color-mix(in srgb, var(--text) 3%, transparent);
  transition: border-color var(--dur-hover) var(--ease-out), translate var(--dur-hover) var(--ease-out);
}
.co-svc:hover { border-color: color-mix(in srgb, var(--text) 20%, transparent); translate: 0 -2px; }
.co-svc-in {
  display: flex; flex-direction: column; gap: 8px; width: 100%;
  padding: 20px 20px 18px; border-radius: 6px; background: var(--bg-elevated);
}
.co-svc h3 { margin: 0; font-family: "Noto Serif SC", var(--font-serif); font-size: 1.0625rem; font-weight: 500; color: var(--text-bright); }
.co-svc p { margin: 0; font-size: 0.8125rem; line-height: 1.7; color: var(--text-secondary); }
.co-svc-fit {
  margin: 2px 0 0 !important; padding-top: 10px;
  border-top: 1px dotted var(--rule-dot-ink);
  font-size: 0.75rem !important; line-height: 1.65 !important; color: var(--text-faint) !important;
}
.co-svc-meta { margin-top: auto !important; padding-top: 12px; font-family: var(--font-mono); font-size: 0.625rem !important; line-height: 1.6 !important; letter-spacing: .02em; color: var(--text-faint) !important; }
/* 收口卡：横着一条，不竖排 */
.co-svc-cta .co-svc-in { flex-direction: row; align-items: baseline; flex-wrap: wrap; gap: 6px 16px; padding: 18px 20px; }
.co-svc-cta h3 { font-size: 1rem; }
.co-svc-link {
  margin-left: auto; font-family: var(--font-mono); font-size: 0.6875rem;
  letter-spacing: .02em; color: var(--accent); text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); padding-bottom: 1px;
}
.co-svc-link:hover { border-color: var(--accent); }

/* ===== 案例证据条：四条信息一行（名字 / 一句话 / 结果 / 时间），hover 只描线变色 ===== */
.co-proof-list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--border-strong); }
.co-proof-list li { border-bottom: 1px dotted var(--rule-dot-ink); }
.co-proof-row {
  display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.5fr) minmax(0, 1.25fr) auto;
  align-items: baseline; gap: 20px; padding: 16px 4px; text-decoration: none;
  transition: background-color var(--dur-hover) var(--ease-out);
}
.co-proof-row:hover { background: color-mix(in srgb, var(--text) 3%, transparent); }
.co-proof-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.co-proof-name { font-family: "Noto Serif SC", var(--font-serif); font-size: 1.0625rem; color: var(--text-bright); }
.co-proof-sub { font-size: 0.8125rem; line-height: 1.6; color: var(--text-secondary); }
.co-proof-result { font-family: var(--font-mono); font-size: 0.6875rem; line-height: 1.6; letter-spacing: .01em; color: var(--accent); }
.co-proof-period { font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .04em; color: var(--text-faint); white-space: nowrap; }
.co-note-link { margin-left: 10px; color: var(--accent); text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); }
.co-note-link:hover { border-color: var(--accent); }
@media (max-width: 900px) {
  .co-proof-row { grid-template-columns: minmax(0, 1fr) auto; row-gap: 4px; }
  .co-proof-name { grid-column: 1; }
  .co-proof-period { grid-column: 2; justify-self: end; }
  .co-proof-sub { grid-column: 1 / -1; }
  .co-proof-result { grid-column: 1 / -1; }
}

/* ===== 交付标准 ===== */
.co-standards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; border-top: 1px solid var(--border-strong); }
.co-std { padding: 22px 22px 20px 0; border-right: 1px dotted var(--rule-dot-ink); display: flex; flex-direction: column; gap: 6px; }
.co-std:last-child { border-right: none; padding-right: 0; }
.co-std-k { font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: .06em; color: var(--accent); }
.co-std-v { font-family: "Noto Serif SC", var(--font-serif); font-size: 1.375rem; color: var(--accent); line-height: 1.2; }
.co-std p { margin: 2px 0 0; font-size: 0.8125rem; line-height: 1.7; color: var(--text-secondary); }

/* ===== FAQ ===== */
.co-faq { border-top: 1px solid var(--border-strong); }
.co-faq-item { border-bottom: 1px dotted var(--rule-dot-ink); }
.co-faq-item summary {
  list-style: none; cursor: pointer; padding: 15px 26px 15px 0; position: relative;
  font-size: 0.9375rem; color: var(--text-bright);
  transition: color var(--dur-hover) var(--ease-out);
}
.co-faq-item summary::-webkit-details-marker { display: none; }
.co-faq-item summary::after {
  content: ""; position: absolute; right: 6px; top: 50%;
  width: 8px; height: 8px;
  border-right: 1px solid var(--text-faint); border-bottom: 1px solid var(--text-faint);
  transform: translateY(-70%) rotate(45deg);
  transition: transform var(--dur-pop) var(--ease-out), border-color var(--dur-hover) var(--ease-out);
}
.co-faq-item[open] summary::after { transform: translateY(-30%) rotate(225deg); border-color: var(--accent); }
.co-faq-item summary:hover { color: var(--accent); }
.co-faq-item summary:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.co-faq-item p { margin: 0 0 16px; padding-right: 26px; font-size: 0.875rem; line-height: 1.8; color: var(--text-secondary); max-width: 68ch; }

/* ===== 结尾 CTA 带 ===== */
.co-cta {
  position: relative; overflow: hidden;
  margin-top: 72px; padding: 44px 40px 38px; border-radius: 8px;
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
}
.co-cta-in { position: relative; z-index: 1; }
.co-cta-title { margin: 0 0 10px; font-family: "Noto Serif SC", var(--font-serif); font-weight: 500; font-size: clamp(1.4rem, 2.6vw, 2rem); line-height: 1.25; letter-spacing: -0.02em; color: var(--text-bright); text-wrap: balance; }
.co-cta-lead { margin: 0; font-size: 0.9375rem; line-height: 1.75; color: var(--text-secondary); max-width: 56ch; }
.co-cta-mail { margin: 22px 0 0; }
.co-cta-mail a {
  font-family: var(--font-mono); font-size: clamp(1.05rem, 1.8vw, 1.375rem);
  letter-spacing: .01em; color: var(--text-bright); text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--text-bright) 26%, transparent);
  padding-bottom: 3px; transition: color var(--dur-hover) var(--ease-out), border-color var(--dur-hover) var(--ease-out);
}
.co-cta-mail a:hover { color: var(--accent); border-color: var(--accent); }
.co-cta-mail a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.co-cta .co-note { margin-top: 18px; }

/* ===== 页脚：四列 ===== */
.co-foot { border-top: 1px solid var(--border-strong); padding-top: 34px; padding-bottom: 44px; display: block; }
.co-foot-cols { display: grid; grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)); gap: 32px; }
.co-foot-brand { display: flex; flex-direction: column; gap: 8px; max-width: 34ch; }
.co-foot-name { font-family: "Noto Serif SC", var(--font-serif); font-size: 1rem; letter-spacing: .02em; color: var(--text-bright); }
.co-foot-brand p { margin: 0; font-family: var(--font-sans); font-size: 0.8125rem; line-height: 1.7; letter-spacing: 0; color: var(--text-secondary); }
.co-foot-copy { margin-top: 6px; font-size: 0.625rem; letter-spacing: .04em; color: var(--text-faint); }
.co-foot-col { display: flex; flex-direction: column; gap: 8px; }
.co-foot-col h3 { margin: 0 0 4px; font-family: var(--font-mono); font-size: 0.625rem; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--text-faint); }
.co-foot-col a, .co-foot-col span { font-family: var(--font-sans); font-size: 0.8125rem; letter-spacing: 0; color: var(--text-secondary); text-decoration: none; }
.co-foot-col a:hover { color: var(--accent); }
.co-foot-col a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ============================================================
   动效：沿用博客那套「滚动驱动、纯 CSS、无 JS 监听」的做法
   （animation-timeline: view()，不支持的浏览器直接看到终态）
   ============================================================ */
@keyframes coRise {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@supports (animation-timeline: view()) {
  /* 整块章节：进视口时升起 */
  .co-sec, .co-metrics, .co-cta, .co-foot {
    animation: coRise linear both;
    animation-timeline: view();
    animation-range: entry 4% entry 30%;
  }
}

/* ---- 悬停：只动合成器属性（translate / 颜色 / 描边），不改布局 ---- */
.co-svc, .mkt-steps li {
  transition: border-color var(--dur-hover) var(--ease-out),
              background-color var(--dur-hover) var(--ease-out),
              box-shadow var(--dur-hover) var(--ease-out),
              translate var(--dur-hover) var(--ease-out);
}
.co-svc:hover, .mkt-steps li:hover { translate: 0 -2px; }
.co-svc:hover { box-shadow: var(--shadow-card); }
.mkt-steps li:hover { border-color: color-mix(in srgb, var(--accent) 26%, transparent); }

/* 表格行：hover 时给一条淡底，不画线 */
.mkt-table tbody tr { transition: background-color var(--dur-hover) var(--ease-out); }
.mkt-table tbody tr:hover { background: color-mix(in srgb, var(--accent) 4%, transparent); }

/* 按钮：按下时下沉 1px（手感），不缩放 */
.co-btn, .co-btn:active { translate: 0 1px; }

/* 页脚链接：hover 时下划线从左侧长出来 */
.co-foot-col a { position: relative; }
.co-foot-col a::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px;
  background: currentColor; transform: scaleX(0); transform-origin: left;
  transition: transform var(--dur-hover) var(--ease-out);
}
.co-foot-col a:hover::after { transform: scaleX(1); }

/* FAQ：<details> 展开时高度动画（Chrome 129+ 支持 ::details-content） */
@supports selector(::details-content) {
  .co-faq-item { interpolate-size: allow-keywords; }
  .co-faq-item::details-content {
    block-size: 0; overflow: hidden;
    transition: block-size .3s var(--ease-out), content-visibility .3s allow-discrete;
  }
  .co-faq-item[open]::details-content { block-size: auto; }
  .co-faq-item summary::after { transition: color var(--dur-hover) var(--ease-out); }
}

@media (prefers-reduced-motion: reduce) {
  .co-sec, .co-metrics, .co-cta, .co-foot, .co-svc, .co-std, .co-metric, .co-faq-item,
  .co-hero-main { animation: none !important; }
  .co-svc:hover, .mkt-steps li:hover, .co-btn:active { translate: none; }
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .co-hero-band { min-height: 0; }
  .co-hero-in { grid-template-columns: minmax(0, 1fr); gap: 32px; align-items: start; padding: 64px 20px 56px; }
  .co-hero-in .co-title { font-size: clamp(2.1rem, 9vw, 3.1rem); line-height: 1.1; letter-spacing: -0.03em; }
  .co-hero-in .co-lead { max-width: none; }
  .co-aside { align-self: stretch; gap: 28px; }
  .co-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .co-svc, .co-svc-cta { grid-column: span 2 !important; }
  .co-svc-cta .co-svc-in { flex-direction: column; align-items: flex-start; }
  .co-svc-link { margin-left: 0; }
  .co-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .co-metric:nth-child(2) { border-right: none; }
  .co-metric:nth-child(-n+2) { border-bottom: 1px dotted var(--rule-dot-ink); }
  .co-standards { grid-template-columns: minmax(0, 1fr); }
  .co-std { border-right: none; padding-right: 0; border-bottom: 1px dotted var(--rule-dot-ink); }
  .co-std:last-child { border-bottom: none; }
  .co-foot-cols { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px; }
}
@media (max-width: 620px) {
    .co-cards { grid-template-columns: minmax(0, 1fr); }
  .co-svc, .co-svc-cta { grid-column: span 1 !important; }
  /* 手机端技术栈换行后，右竖线会孤零零挂在行尾，改用间距分隔 */
  .co-stack-strip li { border-right: none; padding-right: 0; }
  .co-cta { padding: 32px 22px 28px; }
  .co-foot-cols { grid-template-columns: minmax(0, 1fr); }
}
</style>
