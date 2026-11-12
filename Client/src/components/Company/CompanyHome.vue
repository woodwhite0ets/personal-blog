<template>
  <CompanyShell>
    <!-- 首屏：HUD 行 + 左文案 + 右读数面板 + 案例拼版 -->
    <section class="co-hero-band">
      <div class="co-hero-in">
        <div class="co-hud">
          <span class="co-hud-l">
            <span class="co-badge-dot" aria-hidden="true"></span>厦门翔安 · 可开票 · 一天内回信
          </span>
          <span class="co-hud-r">
            <b>木白 / WDW</b>
            <i>AI SYSTEMS · 自建推理 · 接单中</i>
          </span>
        </div>

        <div class="co-hero-main">
          <h1 class="co-title">给已经在跑的业务加 AI 能力</h1>
          <p class="co-lead">知识库检索、模型接入、本地推理与带后台的业务系统。从需求做到上线后的巡检，签合同，按阶段验收。</p>
          <div class="co-actions">
            <router-link class="co-btn co-btn-solid" to="/contact#brief">询价</router-link>
            <router-link class="co-link-arrow" to="/#pricing">看价格与交期</router-link>
            <router-link class="co-link-arrow" to="/work">看案例</router-link>
          </div>
        </div>

        <HeroStatus />

        <!-- 作品即门面：三条证据 + 索引格，一行四格；其余案例都在 /work -->
        <div class="co-hero-board">
          <router-link
            v-for="c in proofCases"
            :key="c.slug"
            :to="`/work/${c.slug}`"
            class="co-board-tile"
          >
            <CaseFigure :slug="c.slug" size="md" />
            <span class="co-board-meta">
              <span class="co-board-name">{{ c.name }}</span>
              <span class="co-board-period">{{ c.period }}</span>
            </span>
          </router-link>
          <router-link to="/work" class="co-board-tile co-board-more">
            <span class="co-board-more-v">{{ caseCount }}<i>个项目</i></span>
            <span class="co-board-meta">
              <span class="co-board-name">全部案例</span>
              <span class="co-board-period">按类型筛选</span>
            </span>
          </router-link>
        </div>
      </div>
    </section>

    <div class="co-main co-page--home">
      <!-- 01 能接的活 -->
      <section id="scope" class="co-sec">
        <CompanySecHead title="能接的活" index="01" latin="SCOPE" />
        <div class="co-cards">
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>知识库与检索</h3>
            <p>内部文档问答和客服答疑，答案带出处。</p>
            <p class="co-svc-fit">适合：文档有几百页以上，客服答一个问题的依据要能说出来。</p>
            <p class="co-svc-meta">交付 · 检索服务 + 评测集 + 部署</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>模型接入</h3>
            <p>在现有系统里加对话和抽取。</p>
            <p class="co-svc-fit">适合：系统已经在跑，不想重做架构；调用量会涨，模型要能换。</p>
            <p class="co-svc-meta">交付 · 接口层 + 提示与工具 + 灰度</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>本地推理</h3>
            <p>数据不能出内网，或者按次计费太贵。</p>
            <p class="co-svc-meta">交付 · 推理端点 + 监控 + 运维手册</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>自动化流程</h3>
            <p>抓取清洗、定时同步和巡检。</p>
            <p class="co-svc-meta">交付 · 任务编排 + 告警 + 运行记录</p>
          </div></article>
          <article class="co-svc"><div class="co-svc-in paper-field">
            <h3>全栈业务系统</h3>
            <p>带账号、后台和报表的站点。</p>
            <p class="co-svc-meta">交付 · 前端 + 接口 + 数据库 + 后台</p>
          </div></article>
          <article class="co-svc co-svc-cta"><div class="co-svc-in paper-field">
            <h3>不确定属于哪一类？</h3>
            <p>把背景和目标发我，先判断值不值得做。</p>
            <router-link class="co-svc-link" to="/contact">说明需求</router-link>
          </div></article>
        </div>
      </section>

      <!-- 02 三项交付标准 -->
      <section id="standard" class="co-sec co-sec--band lab-dark">
        <CompanySecHead title="三项交付标准" index="02" latin="STANDARD" />
        <p class="co-sec-lead">每个项目都按这三条验收，写进合同。</p>
        <div class="co-standards">
          <div class="co-std">
            <span class="co-std-k">可运行 · RUNNABLE</span>
            <span class="co-std-v">有地址</span>
            <p>每次交付都给一个能打开的地址。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">可验收 · ACCEPTABLE</span>
            <span class="co-std-v">有产物</span>
            <p>每阶段有产物和验收标准，也写清这次不做什么。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">可接手 · HANDOVER</span>
            <span class="co-std-v">有手册</span>
            <p>代码、部署脚本和运行手册一起交，能自己维护。</p>
          </div>
        </div>
      </section>

      <!-- 03 做过的几个 -->
      <section id="proof" class="co-sec">
        <CompanySecHead title="做过的几个" index="03" latin="PROOF" />
        <div class="co-lib-bar">
          <div class="co-lib-chips">
            <button
              v-for="c in homeChips"
              :key="c.kind"
              class="co-lib-chip"
              :class="{ 'is-on': homeFilter === c.kind }"
              :aria-pressed="homeFilter === c.kind"
              @click="homeFilter = c.kind"
            >
              {{ c.kind }}<span class="co-lib-n">{{ c.n }}</span>
            </button>
          </div>
          <router-link class="co-lib-more" to="/work">全部案例 →</router-link>
        </div>
        <ul class="co-lib co-lib--3">
          <li v-for="p in homeShown" :key="p.slug">
            <router-link :to="`/work/${p.slug}`" class="co-lib-card">
              <span class="co-lib-thumb"><CaseFigure :slug="p.slug" size="md" /></span>
              <span class="co-lib-body">
                <span class="co-lib-top">
                  <span class="co-lib-kind">{{ p.kind }}</span>
                  <span class="co-lib-period">{{ p.period }}</span>
                </span>
                <span class="co-lib-name">{{ p.name }}</span>
                <span class="co-lib-sub">{{ p.subtitle }}</span>
                <span class="co-lib-result">{{ p.result }}</span>
              </span>
            </router-link>
          </li>
          <li>
            <router-link to="/work" class="co-lib-card co-lib-card--more">
              <span class="co-lib-body">
                <span class="co-lib-top"><span class="co-lib-kind">索引</span></span>
                <span class="co-lib-name">全部案例</span>
                <span class="co-lib-sub">{{ caseCount }} 个项目，按类型筛，每条写了问题与结果。</span>
              </span>
            </router-link>
          </li>
        </ul>
        <p class="co-note">{{ caseCount }} 个项目在生产环境运行，每个都写了问题、做法和结果。</p>
      </section>

      <!-- 04 为什么这样交付 -->
      <section class="co-sec co-sec--band">
        <CompanySecHead title="为什么这样交付" index="04" latin="WHY" />
        <div class="mkt-compare">
          <div class="paper-field"><h3>常见做法</h3><ul><li>先买一堆 SaaS，接口对不上再改</li><li>模型按次计费，用量一涨成本失控</li><li>数据交给第三方 API</li><li>交付一个演示，上线还要再找人</li></ul></div>
          <div class="paper-field"><h3>我的做法</h3><ul><li>先跑通最短那条链路，再往上加</li><li>自建推理，硬件成本固定，没有按次账单</li><li>数据留在客户自己的机器上</li><li>监控配置和运行手册随项目一起交</li></ul></div>
        </div>
      </section>

      <!-- 05 怎么开始 -->
      <section id="process" class="co-sec">
        <CompanySecHead title="怎么开始" index="05" latin="PROCESS" />
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>聊一次</h3><p>说说背景和你想解决的事。不收费，想不清楚也可以先聊。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>给方案与报价</h3><p>拆成阶段，每段有产物和验收标准，写清不做什么。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>按阶段做</h3><p>每阶段可运行、可验收，改完当天可发。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>交付与接手</h3><p>代码、部署和运行手册一起交，能自己维护。</p></li>
        </ol>
      </section>

      <!-- 06 合作方式 -->
      <section id="pricing" class="co-sec co-sec--band">
        <CompanySecHead title="合作方式" index="06" latin="TERMS" />

        <table class="mkt-table">
          <thead><tr><th>方式</th><th>适合</th><th>怎么算</th><th>起步</th></tr></thead>
          <tbody>
            <tr v-for="p in pricing" :key="p.mode">
              <td>{{ p.mode }}</td>
              <td data-th="适合">{{ p.fit }}</td>
              <td data-th="怎么算">{{ p.how }}</td>
              <td class="mkt-price" data-th="起步">{{ p.from }}<span class="mkt-price-sub">{{ p.typical }}</span></td>
            </tr>
          </tbody>
        </table>
        <p class="co-note">{{ pricingNote }}</p>

        <div class="co-actions">
          <router-link class="co-btn co-btn-solid" to="/contact#brief">发需求单</router-link>
          <router-link class="co-link-arrow" to="/contact">先聊一次</router-link>
        </div>

        <!-- 初创版官网：与上面的定制线分开计价，所以不并进表格，也不进 pricing.js。
             首页只做指向（不放价目），细节与档位在 /startup；微信转发直接给 /#startup-hint -->
        <aside id="startup-hint" class="co-sideline" aria-labelledby="sideline-title">
          <div class="co-sideline-copy">
            <h3 id="sideline-title" class="co-sideline-title">初创版官网</h3>
            <p class="co-sideline-lead">公司刚注册、产品刚出来，先要一个能发出去的地址。这一档固定范围和交期，域名和代码都登记在客户名下。</p>
            <p class="co-sideline-fine">按页数与产品数量分档；在校创办的公司另有价目。</p>
          </div>
          <router-link class="co-sideline-go" to="/business/startup">看初创版官网</router-link>
        </aside>
      </section>

      <!-- 07 常见问题 -->
      <section id="faq" class="co-sec">
        <CompanySecHead title="常见问题" index="07" latin="FAQ" />
        <div class="co-faq">
          <details class="co-faq-item" open>
            <summary>报价怎么算？</summary>
            <p>按范围拆成阶段算，聊完给具体数字，写进合同。档位见 <router-link to="/#pricing" class="co-faq-link">合作方式</router-link>。</p>
          </details>
          <details class="co-faq-item">
            <summary>我的数据会不会外传？</summary>
            <p>默认留在你指定的机器上。需要接外部模型接口时，会提前写清哪一段数据出网、出到哪家。<router-link to="/stack" class="co-faq-link">能力与基础设施</router-link>里写了数据边界。</p>
          </details>
          <details class="co-faq-item">
            <summary>交付后我自己能维护吗？</summary>
            <p>能。代码、部署脚本和运行手册一起移交，交付后两周内答疑，之后按次或按月都行。验收方式见 <router-link to="/#standard" class="co-faq-link">三项交付标准</router-link>。</p>
          </details>
          <details class="co-faq-item">
            <summary>多快能开始？</summary>
            <p>一般一周内能排上，着急的按次诊断通常一两天给结论。先聊一次不收费，聊完判断值不值得做。流程见 <router-link to="/#process" class="co-faq-link">怎么开始</router-link>。</p>
          </details>
          <details class="co-faq-item">
            <summary>初创版官网和上面的定制项目是一回事吗？</summary>
            <p>定制项目按范围算，从 3 万起，做长期跑的系统。初创版做门面，范围和交期固定。两边分开报价，<router-link to="/business/startup" class="co-faq-link">初创版的档位写在这里</router-link>。</p>
          </details>
          <details class="co-faq-item">
            <summary>什么情况我不接？</summary>
            <p>只要演示不要上线、预算与范围明显不匹配、或者要我把合规责任一并兜住的项目，我会直说做不了。</p>
          </details>
        </div>
      </section>


      <!-- CTA -->
      <CompanyCta
        title="说说你在做什么，我给方案和报价"
        note="签合同，可开票，按阶段验收。数据可以留在你自己的机器上。"
        hint="写清背景、目标和时间预期就行，一般一天内回。"
      />
    </div>
  </CompanyShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import CompanyShell from './CompanyShell.vue'
import CompanySecHead from './CompanySecHead.vue'
import CompanyCta from './CompanyCta.vue'
import CaseFigure from './CaseFigure.vue'
import HeroStatus from './HeroStatus.vue'
import { pricing, pricingNote } from '../../data/pricing.js'
import { projects } from '../../data/projects.js'

// 首页只放三条证据，其余去 /work；数量一律从数据源算，别在文案里写死
const proofCases = projects.slice(0, 3)
const homeFilter = ref('全部')
const homeChips = computed(() => {
  const map = new Map()
  projects.forEach((p) => map.set(p.kind || '其他', (map.get(p.kind || '其他') || 0) + 1))
  return [{ kind: '全部', n: projects.length }, ...[...map].map(([kind, n]) => ({ kind, n }))]
})
const homeShown = computed(() =>
  projects.filter((p) => homeFilter.value === '全部' || p.kind === homeFilter.value)
)
const caseCount = projects.length
</script>
