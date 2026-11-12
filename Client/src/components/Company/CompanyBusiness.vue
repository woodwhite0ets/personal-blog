<template>
  <CompanyShell>
    <div class="co-main">
      <CompanyMasthead
        title="业务"
        lead="现在接两条线。定制交付按范围算，做完能长期跑；初创版官网按档定价，五到十个工作日上线。两边分开报价。"
        :meta="[
          { k: '业务线', v: '2 条' },
          { k: '结算', v: '按范围 / 按档' },
          { k: '起步', v: '699 元' },
        ]"
      />

      <section class="co-sec">
        <div class="co-cards">
          <article v-for="b in lines" :key="b.name" class="co-svc">
            <div class="co-svc-in paper-field">
              <h3>{{ b.name }}</h3>
              <p>{{ b.lead }}</p>
              <dl class="co-biz-meta">
                <div><dt>适合</dt><dd>{{ b.fit }}</dd></div>
                <div><dt>起步</dt><dd>{{ b.from }}</dd></div>
                <div><dt>周期</dt><dd>{{ b.period }}</dd></div>
                <div><dt>交付</dt><dd>{{ b.deliver }}</dd></div>
              </dl>
              <router-link class="co-svc-link" :to="b.to">{{ b.cta }}</router-link>
            </div>
          </article>
        </div>
        <p class="co-note">列在上面的都是现在能接的。还在准备中的业务不放上来。</p>
      </section>

      <section class="co-sec co-sec--band">
        <CompanySecHead title="两条线的区别" index="01" latin="COMPARE" />
        <table class="mkt-table">
          <thead><tr><th>对比项</th><th>定制交付</th><th>初创版官网</th></tr></thead>
          <tbody>
            <tr><td>适合</td><td>已有系统，或需求清楚的业务问题</td><td>刚注册的公司，缺一个能发出去的地址</td></tr>
            <tr><td>报价方式</td><td>按范围拆阶段，聊完给具体数字</td><td>按档固定价，写在下单页上</td></tr>
            <tr><td>起步</td><td>3 万元</td><td>699 元</td></tr>
            <tr><td>周期</td><td>按阶段推进，每段可验收</td><td>5–10 个工作日</td></tr>
            <tr><td>交付物</td><td>代码、部署脚本、监控与运行手册</td><td>站点本身，完整档另含源码</td></tr>
            <tr><td>售后</td><td>交付后两周内答疑，之后按次或按月</td><td>30 天保修，之后按次或按年</td></tr>
          </tbody>
        </table>
      </section>

      <section class="co-sec">
        <CompanySecHead title="两条线共用的三条" index="02" latin="SHARED RULES" />
        <p class="co-sec-lead">不论范围大小，这三条一样，写进确认单。</p>
        <div class="co-standards">
          <div class="co-std">
            <span class="co-std-k">确认单 · AGREEMENT</span>
            <span class="co-std-v">先写清</span>
            <p>开工前把范围和改几轮写在一页纸上，附验收方式，也写清这次不做什么。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">验收 · ACCEPTANCE</span>
            <span class="co-std-v">按阶段</span>
            <p>每段都有产物，验完再进下一段。</p>
          </div>
          <div class="co-std">
            <span class="co-std-k">售后 · AFTERCARE</span>
            <span class="co-std-v">30 天</span>
            <p>30 天内站挂了或者改错字，免费修。之后按次，或者按年算。</p>
          </div>
        </div>
      </section>

      <section class="co-sec">
        <CompanySecHead title="怎么开始" index="03" latin="PROCESS" />
        <ol class="mkt-steps">
          <li class="paper-field"><span>第 1 步</span><h3>写一封</h3><p>说说背景和想解决的事。不收费，想不清楚也可以先聊。</p></li>
          <li class="paper-field"><span>第 2 步</span><h3>选线</h3><p>要长期跑的系统，还是先要一个地址。选哪条我会直说。</p></li>
          <li class="paper-field"><span>第 3 步</span><h3>确认单</h3><p>范围和交期写在同一页，定金到账就排期。</p></li>
          <li class="paper-field"><span>第 4 步</span><h3>交付与接手</h3><p>交能跑的站或者代码，部署和说明一起给。</p></li>
        </ol>
      </section>

      <section class="co-cta paper-field">
        <div class="co-cta-in">
          <div class="co-cta-copy">
            <h2 class="co-cta-title">说说你在做什么，我来判断走哪条线</h2>
            <p class="co-note">写清背景和想解决的事就够，一般一天内回信。</p>
          </div>
          <div class="co-cta-contact">
            <p class="co-cta-k">写邮件</p>
            <p class="co-cta-mail"><a href="mailto:1903784785@qq.com">1903784785@qq.com</a></p>
            <p class="co-cta-hint">也可以加微信 18157706302。</p>
          </div>
        </div>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
// 业务总览：一条业务线一张卡，下面一张对比表，价与范围都写在这页，细节链接到各自详情页。
// 新增业务线时加一张卡 + 表里加一列，别在别处再抄一份价目。
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'

const lines = [
  {
    name: '定制交付 · AI 应用与系统',
    lead: '给已经在跑的业务加 AI 能力，也做带后台的业务系统。知识库检索和模型接入做得最多。',
    fit: '已有系统，或需求清楚的业务问题',
    from: '3 万元起',
    period: '按阶段',
    deliver: '代码、部署脚本、运行手册',
    to: { path: '/', hash: '#scope' },
    cta: '看能接的活',
  },
  {
    name: '初创版官网',
    lead: '公司刚注册、产品刚出来，先要一个能发出去的地址。一页把你在做什么讲清楚。',
    fit: '缺地址，不改品牌视觉',
    from: '699 元起',
    period: '5–10 个工作日',
    deliver: '站点本身，完整档含源码',
    to: '/business/startup',
    cta: '看档位与流程',
  },
]
</script>
