<template>
  <CompanyShell>
    <div class="co-main">
      <CompanyMasthead
        title="业务"
        lead="两条线，各自范围和计价方式都写清楚：定制交付做能长期运行的系统，初创版官网做刚起步时的门面。不混着报价，也不互相将就。"
        :meta="[
          { k: '业务线', v: '2 条' },
          { k: '结算', v: '按范围 / 按档' },
          { k: '交付', v: '可运行 · 可接手' },
        ]"
      />

      <section class="co-sec">
        <CompanySecHead title="两条业务线" />
        <ul class="co-biz">
          <li v-for="b in lines" :key="b.name" class="co-biz-item">
            <div class="co-biz-head">
              <h3 class="co-biz-name">{{ b.name }}</h3>
              <span class="co-biz-tag">{{ b.tag }}</span>
            </div>
            <p class="co-biz-lead">{{ b.lead }}</p>
            <dl class="co-biz-meta">
              <div><dt>适合</dt><dd>{{ b.fit }}</dd></div>
              <div><dt>起步</dt><dd>{{ b.from }}</dd></div>
              <div><dt>周期</dt><dd>{{ b.period }}</dd></div>
            </dl>
            <router-link class="co-biz-go" :to="b.to">{{ b.cta }}</router-link>
          </li>
        </ul>
        <p class="co-note">下一类业务正在打样，做出来之前不写在这页上——列着的都是能立即接的。</p>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="两条线共用的三条" />
        <p class="co-sec-lead">不论范围大小，这三条一样，写进确认单。</p>
        <div class="co-standards">
          <div class="co-std">
            <span class="co-std-k">确认单 · AGREEMENT</span>
            <span class="co-std-v">先写清</span>
            <p>范围、修改轮次、交期起算点与验收方式，开工前落在一页纸上，也写清这次不做什么。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">验收 · ACCEPTANCE</span>
            <span class="co-std-v">按阶段</span>
            <p>每一段都有产物与验收标准；能打开的地址、能跑的代码，不是演示视频。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">售后 · AFTERCARE</span>
            <span class="co-std-v">30 天</span>
            <p>交付后 30 天内挂机、错字、换图免费处理；之后按次，或按月、按年都行。</p>
          </div>
        </div>
      </section>

      <section class="co-sec">
        <CompanySecHead title="怎么开始" />
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>写一封</h3><p>背景、目标、时间点。不用先想清楚要什么，聊一次不收费。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>选线</h3><p>要长期运行的系统，还是先要一个能发出去的地址；选错线我会直说。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>确认单</h3><p>范围、档位、交期、验收写在同一页；定金到账即排期。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>交付与接手</h3><p>可运行、可验收、可接手；代码或本站、部署与说明一并交。</p></li>
        </ol>
      </section>

      <section class="co-cta paper-field">
        <div class="co-cta-in">
          <div class="co-cta-copy">
            <h2 class="co-cta-title">不确定该走哪条线，就先说说你在做什么</h2>
            <p class="co-note">说清背景和目标就够，选线是我的事。</p>
          </div>
          <div class="co-cta-contact">
            <p class="co-cta-k">写邮件</p>
            <p class="co-cta-mail"><a href="mailto:1903784785@qq.com">1903784785@qq.com</a></p>
            <p class="co-cta-hint">一般一天内回信。</p>
          </div>
        </div>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
// 业务总览：一条业务线一个条目，价与范围只写起步与一句话，细节留给各自的详情页。
// 新增业务线只在这里加一条，别在别处再抄一份价目。
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'

const lines = [
  {
    name: '定制交付 · AI 应用与系统',
    tag: '按范围',
    lead: '把 AI 接进正在跑的业务：知识库与检索、模型接入、本地推理、自动化流程、带后台的全栈系统。从需求到上线后的巡检，一个人负责到底。',
    fit: '已有业务系统或明确需求，要能长期运行',
    from: '3 万起',
    period: '按阶段',
    to: { path: '/', hash: '#scope' },
    cta: '看能接的活',
  },
  {
    name: '初创版官网',
    tag: '按档',
    lead: '给刚注册、刚出产品的团队：一版把「你在做什么」讲清楚的官网。范围与交期固定，域名、托管与代码都在你名下。',
    fit: '缺一个能发出去的地址，不是品牌重塑',
    from: '699 起',
    period: '5–10 个工作日',
    to: '/business/startup',
    cta: '看档位与流程',
  },
]
</script>
