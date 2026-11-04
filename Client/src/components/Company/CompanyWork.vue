<template>
  <div class="co-page">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav variant="company" />

    <main class="co-main">
      <section class="co-sec" style="margin-top: 8px">
        <h1 class="co-page-title">案例</h1>
        <p class="co-lead">五个已上线的项目，每条写清解决什么问题、怎么做的、结果是什么。</p>
      </section>
      <section class="co-sec">
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
        <p class="co-note">想看某个项目的完整过程，点进项目页；技术细节写在博客里。</p>
      </section>

    </main>

    <footer class="co-foot">
      <span>© {{ year }} 木白 woodwhite</span>
      <span class="co-foot-links">
        <router-link to="/blog">博客</router-link>
        <a href="https://github.com/woodwhite0ets" target="_blank" rel="noopener noreferrer">GitHub</a>
      </span>
    </footer>
  </div>
</template>

<script setup>
import SiteNav from '../common/SiteNav.vue'
import { projects } from '../../data/projects.js'

const cases = projects
const year = new Date().getFullYear()
</script>
