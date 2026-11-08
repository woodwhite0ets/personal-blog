<template>
  <CompanyShell>
    <!-- 首屏：与博客同一套「印在纸上的画」背景 + 左文 + 右交付清单 -->
    <section class="hero-band co-hero-band">
      <HeroBackdrop session-key="company-hero-art" :art-count="5" />
      <div class="hero-in co-hero-in">
        <div class="co-hero-main">
          <p class="co-badge"><span class="co-badge-dot" aria-hidden="true"></span>浙江乐清 · 可开票 · 一天内回信</p>
          <h1 class="co-title">把 AI 接进你的业务，<br /><span class="co-title-key">交付到稳定运行</span></h1>
          <p class="co-lead">从需求、数据、模型到部署与巡检，全程一人负责。签合同、按阶段验收、可开票。</p>
          <div class="co-actions">
            <router-link class="co-btn co-btn-solid" to="/work">看 {{ caseCount }} 个案例</router-link>
            <a class="co-btn" href="mailto:1903784785@qq.com">项目咨询</a>
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

    <div class="co-main">
      <!-- 指标带 -->
      <section class="co-metrics" aria-label="关键数字" ref="metricsRef">
        <div class="co-metric" v-for="(m, i) in metrics" :key="m.label">
          <span class="co-metric-v">{{ shown[i] }}{{ m.suffix }}</span>
          <span class="co-metric-k">{{ m.label }}</span>
        </div>
      </section>

      <!-- 01 能接的活 -->
      <section id="scope" class="co-sec">
        <CompanySecHead title="能接的活" />
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
            <router-link class="co-svc-link" to="/contact">说明需求</router-link>
          </div></article>
        </div>
      </section>

      <!-- 02 交付标准 -->
      <section id="standard" class="co-sec co-sec--band">
        <CompanySecHead title="三项交付标准" />
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
        <CompanySecHead title="做过的几个" />
        <ul class="co-proof-list">
          <li v-for="c in proofCases" :key="c.slug">
            <router-link :to="`/work/${c.slug}`" class="co-proof-row">
              <span class="co-proof-name">{{ c.name }}</span>
              <span class="co-proof-sub">{{ c.subtitle }}</span>
              <span class="co-proof-result">{{ c.result }}</span>
              <span class="co-proof-period">{{ c.period }}</span>
              <span class="co-proof-arrow" aria-hidden="true">→</span>
            </router-link>
          </li>
        </ul>
        <p class="co-note">共 {{ caseCount }} 个项目在生产环境运行，每个都写清问题、做法与结果。<router-link to="/work" class="co-note-link">全部案例</router-link></p>
      </section>

      <!-- 03 为什么这样交付 -->
      <section class="co-sec co-sec--band">
        <CompanySecHead title="为什么这样交付" />
        <div class="mkt-compare">
          <div class="paper-field"><h3>常见做法</h3><ul><li>先买一堆 SaaS，接口对不上再改</li><li>模型按次计费，用量一涨成本失控</li><li>数据交给第三方 API</li><li>交付一个演示，上线还要再找人</li></ul></div>
          <div class="paper-field"><h3>我的做法</h3><ul><li>先跑通最短链路，再逐步扩展</li><li>自建推理，硬件成本固定</li><li>数据保留在自有环境</li><li>交付后可自主维护，含监控与运行手册</li></ul></div>
        </div>
      </section>

      <!-- 04 怎么开始 -->
      <section id="process" class="co-sec">
        <CompanySecHead title="怎么开始" />
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>聊一次</h3><p>背景、目标、时间点。不收费，需求不清晰也可以先聊。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>给方案与报价</h3><p>拆成阶段，每段有产物和验收标准，写清不做什么。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>按阶段做</h3><p>每阶段可运行、可验收，改完当天可发。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>交付与接手</h3><p>代码、部署、监控、运行手册，能自己维护。</p></li>
        </ol>
      </section>

      <!-- 05 合作方式 -->
      <section id="pricing" class="co-sec co-sec--band">
        <CompanySecHead title="合作方式" />
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
        <CompanySecHead title="常见问题" />
        <div class="co-faq">
          <details class="co-faq-item" open>
            <summary>报价怎么算？</summary>
            <p>按范围拆阶段算。聊完给具体数字，写进合同；不做「先低价试水再加价」那套。档位见 <router-link to="/#pricing" class="co-faq-link">合作方式</router-link>。</p>
          </details>
          <details class="co-faq-item">
            <summary>我的数据会不会外传？</summary>
            <p>默认留在你指定的机器上。确实需要接外部模型接口时，会提前写清哪一段数据出网、出到哪家；<router-link to="/stack" class="co-faq-link">能力与基础设施</router-link>里写了数据边界。</p>
          </details>
          <details class="co-faq-item">
            <summary>交付后我自己能维护吗？</summary>
            <p>能。代码、部署脚本、监控配置和运行手册一起移交，交付后两周内答疑；之后按次或按月都行。验收方式见 <router-link to="/#standard" class="co-faq-link">三项交付标准</router-link>。</p>
          </details>
          <details class="co-faq-item">
            <summary>多快能开始？</summary>
            <p>一般一周内能排上；着急的按次诊断通常一两天内给结论。先聊一次判断值不值得做，不收费。流程见 <router-link to="/#process" class="co-faq-link">怎么开始</router-link>。</p>
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
          <div class="co-cta-copy">
            <h2 class="co-cta-title">把你的想法说清楚，剩下的我来落地</h2>
            <p class="co-note">签合同 · 可开票 · 按阶段验收 · 数据可留在自己机器上</p>
          </div>
          <!-- 联系方式直接摆出来，不做成按钮 -->
          <div class="co-cta-contact">
            <p class="co-cta-k">写邮件</p>
            <p class="co-cta-mail"><a href="mailto:1903784785@qq.com">1903784785@qq.com</a></p>
            <p class="co-cta-hint">邮件里写清背景、目标和时间预期就行，一般一天内回。</p>
          </div>
        </div>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import HeroBackdrop from '../common/HeroBackdrop.vue'
import CompanyShell from './CompanyShell.vue'
import CompanySecHead from './CompanySecHead.vue'
import { projects } from '../../data/projects.js'

// 首页只放三条证据，其余去 /work；数量一律从数据源算，别在文案里写死
const proofCases = projects.slice(0, 3)
const caseCount = projects.length

// ====== 指标带：进入视口时从 0 滚到目标值 ======
const metrics = [
  { value: caseCount, suffix: '', label: '已交付项目' },
  { value: 10, suffix: ' 万+', label: '生产环境数据条数' },
  { value: 7, suffix: '×24', label: '自建工作站在线' },
  { value: 1, suffix: ' 天', label: '首次回信' },
]
const shown = ref(metrics.map(() => 0))
const metricsRef = ref(null)
let io = null
let raf = 0
let settleTimer = 0

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
  settleTimer = window.setTimeout(settle, duration + 260)
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
  if (settleTimer) clearTimeout(settleTimer)
})
</script>
