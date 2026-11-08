<template>
  <CompanyShell>
    <div class="co-main">
      <template v-if="project">
        <CompanyMasthead
          :title="project.name"
          :lead="project.subtitle"
          :meta="[{ k: '状态', v: project.status }, { k: '时间', v: project.period }]"
        />

        <CaseFigure :slug="project.slug" size="lg" />

        <div class="co-proj-body">
          <div class="co-proj-main">
            <p class="co-proj-lead">{{ project.summary }}</p>

            <section v-for="s in project.sections" :key="s.title" class="co-proj-sec">
              <h2 class="co-proj-h">{{ s.title }}</h2>
              <p class="co-proj-p">{{ s.body }}</p>
            </section>

            <section v-if="project.links && project.links.length" class="co-proj-sec">
              <h2 class="co-proj-h">原始记录</h2>
              <ul class="co-link-list">
                <li v-for="l in project.links" :key="l.to">
                  <router-link :to="l.to">{{ l.label }}</router-link>
                </li>
              </ul>
              <p class="co-proj-note">这些链接指向博客里的实现记录，会换到 blog 域。</p>
            </section>
          </div>

          <aside class="co-proj-aside" aria-label="项目事实">
            <dl class="co-proj-facts">
              <div><dt>结果</dt><dd>{{ project.result }}</dd></div>
              <div><dt>技术栈</dt><dd>{{ project.stack.join(' · ') }}</dd></div>
            </dl>
          </aside>
        </div>

        <nav v-if="next" class="co-next" aria-label="下一个案例">
          <span class="co-next-k">下一个案例</span>
          <router-link :to="`/work/${next.slug}`" class="co-next-link">{{ next.name }} <span aria-hidden="true">→</span></router-link>
        </nav>
      </template>

      <section v-else class="co-sec">
        <h1 class="co-page-title">没找到这个案例</h1>
        <p class="co-lead">它可能已经改名或下架。</p>
        <div class="co-actions">
          <router-link class="co-btn co-btn-solid" to="/work">回案例列表</router-link>
          <router-link class="co-btn" to="/">回首页</router-link>
        </div>
      </section>
    </div>
  </CompanyShell>
</template>
<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import CompanyShell from './CompanyShell.vue'
import CaseFigure from './CaseFigure.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanySecHead from './CompanySecHead.vue'
import { findProject, projects } from '../../data/projects.js'
import { SITE } from '../../data/routeMeta.js'
import { applyPageMeta } from '../../utils/seo.js'

const route = useRoute()
const project = computed(() => findProject(String(route.params.slug || '')))
const next = computed(() => {
  if (!project.value) return null
  const i = projects.findIndex((p) => p.slug === project.value.slug)
  return i >= 0 && i + 1 < projects.length ? projects[i + 1] : null
})

// 详情页 slug 是动态的，ROUTE_META 表里没有；标题/描述/canonical 在这里自己写
watchEffect(() => {
  const p = project.value
  if (!p) {
    applyPageMeta({
      title: '没找到这个案例 — 木白 woodwhite',
      description: '这个案例可能已经改名或下架，回案例列表看看别的。',
      canonical: `${SITE.company}/work`,
    })
    return
  }
  applyPageMeta({
    title: `${p.name} — 案例 · 木白 woodwhite`,
    description: p.summary,
    canonical: `${SITE.company}/work/${encodeURIComponent(p.slug)}`,
  })
})
</script>
