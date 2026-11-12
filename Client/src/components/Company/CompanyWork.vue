<template>
  <CompanyShell>
    <div class="co-main">
      <CompanyMasthead
        title="案例"
        :lead="`${cases.length} 个项目在生产环境运行，每条写清解决什么问题、怎么做的、结果是什么。`"
        :meta="[
          { k: '在运行', v: `${cases.length} 个` },
          { k: '交付', v: '代码 · 部署 · 文档' },
          { k: '结算', v: '按阶段验收' },
        ]"
      />

      <section class="co-sec">
        <CompanySecHead title="在生产环境跑的" index="01" latin="IN PRODUCTION" />
        <ul class="co-cases">
          <li v-for="p in cases" :key="p.slug" class="co-case">
            <router-link :to="`/work/${p.slug}`" class="co-case-link">
              <CaseFigure :slug="p.slug" size="md" />
              <span class="co-case-body">
              <span class="co-case-head">
                <span class="co-case-name">{{ p.name }}</span>
                <span class="co-case-status">{{ p.status }}</span>
                <span class="co-case-period">{{ p.period }}</span>
                <span class="co-case-go" aria-hidden="true">→</span>
              </span>
              <span class="co-case-sub">{{ p.subtitle }}</span>
              <span class="co-case-result">结果：{{ p.result }}</span>
              </span>
            </router-link>
          </li>
        </ul>
        <p class="co-note">想看某个项目的完整过程，点进项目页；技术细节写在博客里。</p>
      </section>
      <CompanyCta
        title="你的问题在不在这些案例里"
        note="说清现在卡在哪，我先判断值不值得做，不收费。"
        hint="写清背景和目标就行，一般一天内回。"
      />
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import CaseFigure from './CaseFigure.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import { projects } from '../../data/projects.js'
import CompanyCta from './CompanyCta.vue'

const cases = projects
</script>
