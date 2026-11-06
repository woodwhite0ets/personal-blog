<template>
  <CompanyShell>
    <div class="co-main">
      <section class="co-sec">
        <h1 class="co-page-title">案例</h1>
        <p class="co-lead">{{ cases.length }} 个已上线的项目，每条写清解决什么问题、怎么做的、结果是什么。</p>
      </section>
      <section class="co-sec">
        <ul class="co-cases">
          <li v-for="p in cases" :key="p.slug" class="co-case">
            <router-link :to="`/projects/${p.slug}`" class="co-case-link">
              <span class="co-case-head">
                <span class="co-case-name">{{ p.name }}</span>
                <span class="co-case-status">{{ p.status }}</span>
                <span class="co-case-period">{{ p.period }}</span>
              </span>
              <span class="co-case-sub">{{ p.subtitle }}</span>
              <span class="co-case-result">结果：{{ p.result }}</span>
            </router-link>
          </li>
        </ul>
        <p class="co-note">想看某个项目的完整过程，点进项目页（在博客站打开）；技术细节写在博客里。</p>
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
import CompanyShell from './CompanyShell.vue'
import { projects } from '../../data/projects.js'

const cases = projects
</script>
