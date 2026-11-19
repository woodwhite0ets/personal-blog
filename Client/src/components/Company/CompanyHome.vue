<template>
  <CompanyShell>
    <CompanyDeck>
      <!-- ============ 屏 0 · 铭牌 ============
           首页不放口号大字：一进来看到的是这台「机器」的铭牌 ——
           谁做的、做什么、怎么做、交了算什么、现在什么状态，全是字段。 -->
      <section id="plate" class="dk-screen co-plate" data-screen data-no="00" data-label="铭牌">
        <div class="dk-bg" aria-hidden="true"><DeckFigure name="plate" /></div>
        <!-- 机器在跑：一条缓慢左移的心电波形带。
             不写文案、不做导航，只让首屏上方有"活的"东西。 -->
        <div class="co-pulse" aria-hidden="true">
          <div class="co-pulse-in">
            <span class="co-pulse-live"><i></i>LIVE</span>
            <span class="co-pulse-meta">自建推理 · 出站隧道 · 每日 03:00 自检</span>
          </div>
        </div>

        <div class="dk-in">
          <div class="co-hud">
            <span class="co-hud-l">
              <span class="co-badge-dot" aria-hidden="true"></span>厦门翔安 · 可开票 · 一天内回信
            </span>
            <span class="co-hud-r">
              <b>木白 / WDW</b>
              <i>AI SYSTEMS · 自建推理 · 接单中</i>
            </span>
          </div>

          <div class="co-plate-panel">
            <div class="co-plate-head">
              <p class="co-plate-k">PLATE · 铭牌</p>
              <h1 id="plate-name" class="co-plate-name">木白智能</h1>
              <p class="co-plate-sub">木白（厦门）智能软件科技有限公司 · 软件开发与 AI 应用开发 · 可开票</p>
            </div>

            <div class="co-plate-led">
              <ul class="co-plate-lights">
                <li v-for="l in systemStatus.lights" :key="l.label">
                  <i class="co-plate-dot" :class="`is-${l.state}`" aria-hidden="true"></i>{{ l.label }}
                </li>
              </ul>
              <dl class="co-plate-read">
                <div v-for="(m, i) in systemStatus.metrics" :key="m.key">
                  <dt>{{ m.key }}</dt>
                  <dd><b>{{ shown[i] }}</b><i>{{ m.unit }}</i><span>{{ m.note }}</span></dd>
                </div>
              </dl>
            </div>

            <dl class="co-plate-fields">
              <div>
                <dt>做什么</dt>
                <dd>知识库检索 · 模型接入 · 本地推理 · 带后台的业务系统</dd>
              </div>
              <div>
                <dt>怎么做</dt>
                <dd>先跑通最短的一条链路，再按阶段往上加</dd>
              </div>
              <div>
                <dt>交付物</dt>
                <dd>代码 · 部署脚本 · 运行手册</dd>
              </div>
            </dl>

            <ul id="standard" class="co-plate-std">
              <li v-for="s in standards" :key="s.k">
                <span class="co-plate-std-k">{{ s.k }}</span>
                <span class="co-plate-std-v">{{ s.v }}</span>
                <span class="co-plate-std-n">{{ s.n }}</span>
              </li>
            </ul>

            <div class="co-plate-strip">
              <router-link v-for="p in plateCases" :key="p.slug" :to="`/work/${p.slug}`" class="co-plate-case">
                <span class="co-plate-case-fig"><CaseFigure :slug="p.slug" size="md" /></span>
                <span class="co-plate-case-t">
                  <b>{{ p.name }}</b>
                  <i>{{ p.result }}</i>
                </span>
              </router-link>
              <router-link to="/work" class="co-plate-all">
                <span>全部 {{ caseCount }} 个项目</span>
                <i>按类型筛 · 每条写了问题与结果</i>
              </router-link>
            </div>

            <div class="co-plate-actions">
              <router-link class="co-btn co-btn-solid" to="/contact#brief">发需求单</router-link>
              <router-link class="co-link-arrow" to="/#pricing">看价格与交期</router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ 屏 1 · 能接的活 ============ -->
      <section id="scope" class="dk-screen" data-screen data-no="01" data-label="能接的活">
        <div class="dk-bg" aria-hidden="true"><DeckFigure name="scope" /></div>
        <div class="dk-in">
          <CompanySecHead title="能接的活" index="01" latin="SCOPE" />
          <p class="co-sec-lead">五类活。每类写清适用前提和交付物，不适合的不接。</p>
          <div class="co-cards">
            <article class="co-svc"><div class="co-svc-in paper-field">
              <h3>知识库与检索<em class="co-svc-dur">3–6 周</em></h3>
              <p>内部文档问答和客服答疑，答案带出处。</p>
              <p class="co-svc-fit">文档几百页以上，答一个问题的依据要能说出来。</p>
              <router-link class="co-svc-case" to="/work/notes"><i>做过</i>笔记（知识库）</router-link>
              <p class="co-svc-meta">交付 · 检索服务 + 评测集 + 部署</p>
            </div></article>
            <article class="co-svc"><div class="co-svc-in paper-field">
              <h3>模型接入<em class="co-svc-dur">2–4 周</em></h3>
              <p>在现有系统里加对话和抽取。</p>
              <p class="co-svc-fit">系统已经在跑，不想重做架构；调用量会涨，模型要能换。</p>
              <router-link class="co-svc-case" to="/work/ai-daily"><i>做过</i>AI 项目榜</router-link>
              <p class="co-svc-meta">交付 · 接口层 + 提示与工具 + 灰度</p>
            </div></article>
            <article class="co-svc"><div class="co-svc-in paper-field">
              <h3>本地推理<em class="co-svc-dur">1–3 周</em></h3>
              <p>数据不能出内网，或者按次计费太贵。</p>
              <p class="co-svc-fit">有闲着的机器，能接受吞吐低于在线大模型。</p>
              <router-link class="co-svc-case" to="/work/workstation"><i>做过</i>个人 AI 工作站</router-link>
              <p class="co-svc-meta">交付 · 推理端点 + 监控 + 运维手册</p>
            </div></article>
            <article class="co-svc"><div class="co-svc-in paper-field">
              <h3>自动化流程<em class="co-svc-dur">1–2 周</em></h3>
              <p>抓取清洗、定时同步和巡检。</p>
              <p class="co-svc-fit">有稳定的数据源，规则会变，需要留运行记录。</p>
              <router-link class="co-svc-case" to="/work/blog"><i>做过</i>woodwhite@blog</router-link>
              <p class="co-svc-meta">交付 · 任务编排 + 告警 + 运行记录</p>
            </div></article>
            <article class="co-svc"><div class="co-svc-in paper-field">
              <h3>全栈业务系统<em class="co-svc-dur">4–8 周</em></h3>
              <p>带账号、后台和报表的站点。</p>
              <p class="co-svc-fit">需求边界能一次说清，不需要长期迭代团队。</p>
              <router-link class="co-svc-case" to="/work/charging-map"><i>做过</i>乐清市充电桩分布图</router-link>
              <p class="co-svc-meta">交付 · 前端 + 接口 + 数据库 + 后台</p>
            </div></article>
            <article class="co-svc co-svc-cta"><div class="co-svc-in paper-field">
              <h3>不接的四类</h3>
              <ul class="co-svc-no">
                <li>只要演示，不打算上线</li>
                <li>预算与范围差一个量级</li>
                <li>要我把合规责任一并兜住</li>
                <li>要求承诺排名或转化</li>
              </ul>
              <router-link class="co-svc-link" to="/contact">不确定就先说背景</router-link>
            </div></article>
          </div>
        </div>
      </section>

      <!-- ============ 屏 2 · 做过的几个 ============ -->
      <section id="proof" class="dk-screen" data-screen data-no="02" data-label="做过的几个">
        <div class="dk-bg" aria-hidden="true"><DeckFigure name="proof" /></div>
        <div class="dk-in">
          <CompanySecHead title="做过的几个" index="02" latin="PROOF" />
          <div class="co-lib-bar">
            <p class="co-lib-lead">五个项目，都写清问题、做法和结果。</p>
            <router-link class="co-lib-more" to="/work">全部案例 →</router-link>
          </div>
          <ul class="co-lib co-lib--3 co-lib--tight">
            <li v-for="p in projects" :key="p.slug">
              <router-link :to="`/work/${p.slug}`" class="co-lib-card">
                <span class="co-lib-thumb"><CaseFigure :slug="p.slug" size="md" /></span>
                <span class="co-lib-body">
                  <span class="co-lib-top">
                    <span class="co-lib-kind">{{ p.kind }}</span>
                    <span class="co-lib-period">{{ p.period }}</span>
                  </span>
                  <span class="co-lib-name">{{ p.name }}</span>
                  <span class="co-lib-result">{{ p.result }}</span>
                  <span class="co-lib-foot">
                    <span class="co-lib-stack">
                      <i v-for="t in (p.stack || []).slice(0, 2)" :key="t">{{ t }}</i>
                    </span>
                    <span class="co-lib-status" :class="{ 'is-live': p.status !== '已交付' }">{{ p.status }}</span>
                  </span>
                </span>
              </router-link>
            </li>
            <li>
              <router-link to="/work" class="co-lib-card co-lib-card--more">
                <span class="co-lib-body">
                  <span class="co-lib-top"><span class="co-lib-kind">索引</span></span>
                  <span class="co-lib-name">全部 {{ projects.length }} 个</span>
                  <span class="co-lib-sub">按类型筛，每条写了问题与结果</span>
                  <span class="co-lib-go">进案例库 →</span>
                </span>
              </router-link>
            </li>
          </ul>

          <!-- 时间轴：五件事按时间排开，最后一段留空指向「现在」 -->
          <ol class="co-track" aria-label="交付时间轴">
            <li v-for="p in timeline" :key="'t-' + p.slug">
              <span class="co-track-dot" :class="{ 'is-live': p.ongoing }" aria-hidden="true"></span>
              <span class="co-track-date">{{ p.start }}{{ p.ongoing ? ' → 至今' : '' }}</span>
              <span class="co-track-name">{{ p.kind }}</span>
            </li>
          </ol>
        </div>
      </section>

      <!-- ============ 屏 3 · 怎么交付 ============
           原来的「为什么这样交付」和「怎么开始」两节合并成一屏：
           左边是四步，右边是为什么这么做的对照。 -->
      <section id="process" class="dk-screen" data-screen data-no="03" data-label="怎么交付">
        <div class="dk-bg" aria-hidden="true"><DeckFigure name="process" /></div>
        <div class="dk-in">
          <CompanySecHead title="怎么交付" index="03" latin="PROCESS" />
          <div class="co-flow">
            <ol class="mkt-steps co-flow-steps">
              <li class="paper-field"><span>第 1 步</span><h3>聊一次</h3><p>说说背景和想解决的事。不收费。</p><em class="co-flow-out">给你 · 一页需求单</em></li>
              <li class="paper-field"><span>第 2 步</span><h3>给方案与报价</h3><p>拆成阶段，写清不做什么。</p><em class="co-flow-out">给你 · 阶段清单 + 报价</em></li>
              <li class="paper-field"><span>第 3 步</span><h3>按阶段做</h3><p>每阶段可运行、可验收，改完当天可发。</p><em class="co-flow-out">给你 · 一个能打开的地址</em></li>
              <li class="paper-field"><span>第 4 步</span><h3>交付与接手</h3><p>代码、部署和手册一起交。</p><em class="co-flow-out">给你 · 源码 + 脚本 + 手册</em></li>
            </ol>
            <div class="mkt-compare co-flow-compare">
              <div class="paper-field">
                <h3>常见做法</h3>
                <ul><li>先买一堆 SaaS，接口对不上再改</li><li>模型按次计费，用量一涨成本失控</li><li>数据交给第三方 API</li><li>交付一个演示，上线还要再找人</li></ul>
              </div>
              <div class="paper-field">
                <h3>我的做法</h3>
                <ul><li>先跑通最短那条链路，再往上加</li><li>自建推理，硬件成本固定，没有按次账单</li><li>数据留在客户自己的机器上</li><li>监控配置和运行手册随项目一起交</li></ul>
              </div>
            </div>
          </div>

          <div class="co-prep">
            <p class="co-prep-k">开工前你要准备</p>
            <ul class="co-prep-list">
              <li>营业执照</li>
              <li>一句话介绍</li>
              <li>产品清单 ≤ 4</li>
              <li>联系方式</li>
              <li>两个参考站</li>
            </ul>
            <p class="co-prep-time">工作日 24 小时内回信 · 预览发出 3 天无异议视为通过</p>
          </div>
        </div>
      </section>

      <!-- ============ 屏 4 · 合作方式 ============ -->
      <section id="pricing" class="dk-screen" data-screen data-no="04" data-label="合作方式">
        <div class="dk-bg" aria-hidden="true"><DeckFigure name="pricing" /></div>
        <div class="dk-in">
          <CompanySecHead title="合作方式" index="04" latin="TERMS" />
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
          <p class="co-excl"><span class="co-excl-k">不包含</span>域名与服务器 · 备案代办 · 文案与拍摄 · 电商支付与会员对接</p>

          <div class="co-actions">
            <router-link class="co-btn co-btn-solid" to="/contact#brief">发需求单</router-link>
            <router-link class="co-link-arrow" to="/contact">先聊一次</router-link>
          </div>

          <!-- 初创版官网：与上面的定制线分开计价，所以不并进表格，也不进 pricing.js。
               首页只做指向（不放价目），细节与档位在 /startup。 -->
          <aside id="startup-hint" class="co-sideline" aria-labelledby="sideline-title">
            <div class="co-sideline-copy">
              <h3 id="sideline-title" class="co-sideline-title">初创版官网</h3>
              <p class="co-sideline-lead">公司刚注册、产品刚出来，先要一个能发出去的地址。这一档固定范围和交期，域名和代码都登记在客户名下。</p>
              <p class="co-sideline-fine">按页面数量分档；在校创办的公司按在校价。</p>
            </div>
            <router-link class="co-sideline-go" to="/business/startup">看初创版官网</router-link>
          </aside>
        </div>
      </section>

      <!-- ============ 屏 5 · 常见问题 + 下一步 ============ -->
      <section id="faq" class="dk-screen" data-screen data-no="05" data-label="常见问题">
        <div class="dk-bg" aria-hidden="true"><DeckFigure name="faq" /></div>
        <div class="dk-in">
          <CompanySecHead title="常见问题" index="05" latin="FAQ" />
          <div class="co-ask">
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
                <summary>能开发票吗？</summary>
                <p>能，普票含在报价里。对公付款，合同写“含普票”。</p>
              </details>
              <details class="co-faq-item">
                <summary>交付后出问题怎么办？</summary>
                <p>交付后 30 天内挂机与错字免费处理；之后按次 50 起，或按年费包 8 次内容修改。</p>
              </details>
              <details class="co-faq-item">
                <summary>什么情况我不接？</summary>
                <p>只要演示不要上线、预算与范围明显不匹配、或者要我把合规责任一并兜住的项目，我会直说做不了。</p>
              </details>
            </div>

            <aside class="co-ask-next paper-field" aria-labelledby="ask-next-t">
              <p class="co-cta-k">下一步</p>
              <h3 id="ask-next-t" class="co-ask-next-t">说说你在做什么，我给方案和报价</h3>
              <p class="co-ask-next-p">写清背景、目标和时间预期就行，一般一天内回。签合同，可开票，按阶段验收。</p>
              <router-link class="co-btn co-btn-solid" to="/contact#brief">填需求单</router-link>
              <a class="co-ask-next-mail" href="mailto:1903784785@qq.com">或发邮件 1903784785@qq.com</a>
              <ul class="co-ask-next-facts">
                <li>厦门 · 翔安</li>
                <li>可开票</li>
                <li>一周内可排上</li>
                <li>数据可以留在你自己的机器上</li>
              </ul>
            </aside>
          </div>
        </div>
      </section>
    </CompanyDeck>
  </CompanyShell>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAutoAnimate } from '@formkit/auto-animate/vue'
import CompanyShell from './CompanyShell.vue'
import CompanyDeck from './CompanyDeck.vue'
import DeckFigure from './DeckFigure.vue'
import CompanySecHead from './CompanySecHead.vue'
import CaseFigure from './CaseFigure.vue'
import { useCountUp } from '../../composables/useCountUp.js'
import { systemStatus } from '../../data/systemStatus.js'
import { pricing, pricingNote } from '../../data/pricing.js'
import { projects } from '../../data/projects.js'

// 数量一律从数据源算，别在文案里写死
// 时间轴要按时间排，不跟着数据顺序走
const timeline = computed(() =>
  [...projects]
    .sort((a, b) => String(a.period).localeCompare(String(b.period)))
    .map((p) => ({
      slug: p.slug,
      start: String(p.period).split('–')[0].trim(),
      ongoing: String(p.period).includes('至今'),
      kind: p.kind,
    }))
)


const homeFilter = ref('全部')
const homeChips = computed(() => {
  const map = new Map()
  projects.forEach((p) => map.set(p.kind || '其他', (map.get(p.kind || '其他') || 0) + 1))
  return [{ kind: '全部', n: projects.length }, ...[...map].map(([kind, n]) => ({ kind, n }))]
})
// 一屏一页之后首页只放三张（多出来的在 /work）；筛选后同样取前三，
// 否则筛一次就把第三行卡片挤到屏幕外面去。
const homeShown = computed(() =>
  projects
    .filter((p) => homeFilter.value === '全部' || p.kind === homeFilter.value)
    .slice(0, 3)
)
const caseCount = projects.length

// 铭牌上的三条验收刻印：与 02 屏的三项交付标准同一件事，这里只留一句
const standards = [
  { k: '可运行 · RUNNABLE', v: '有地址', n: '每次交付都能打开' },
  { k: '可验收 · ACCEPTABLE', v: '有产物', n: '每阶段写清做与不做' },
  { k: '可接手 · HANDOVER', v: '有手册', n: '代码与部署一起交' },
]

// 铭牌底部只放三个，多得进 /work
const plateCases = computed(() => projects.slice(0, 3))
const shown = useCountUp(systemStatus.metrics.map((m) => m.value), { duration: 760, delay: 420 })

// 分类筛选会让卡片增删重排：交给 auto-animate 补间，避免列表整体瞬移
const [libEl] = useAutoAnimate({ duration: 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
</script>
