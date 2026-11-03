<template>
  <div class="proj-page">
    <SiteNav />

    <main class="proj-main">
      <header class="proj-head">
        <p class="proj-kicker">项目</p>
        <h1 class="proj-title">{{ project.name }}</h1>
        <p class="proj-sub">{{ project.subtitle }}</p>
        <p class="proj-meta">
          <span class="proj-status">{{ project.status }}</span>
          <time>{{ project.period }}</time>
        </p>
        <p class="proj-summary">{{ project.summary }}</p>
        <ul class="proj-stack">
          <li v-for="s in project.stack" :key="s">{{ s }}</li>
        </ul>
        <p v-if="project.links.length" class="proj-links">
          <template v-for="(l, i) in project.links" :key="l.label">
            <a v-if="l.external" :href="l.to" class="proj-link" target="_blank" rel="noopener noreferrer">{{ l.label }}</a>
            <router-link v-else :to="l.to" class="proj-link">{{ l.label }}</router-link>
            <span v-if="i < project.links.length - 1" class="proj-link-sep" aria-hidden="true">·</span>
          </template>
        </p>
      </header>

      <section v-for="sec in project.sections" :key="sec.title" class="proj-sec">
        <h2 class="proj-sec-title">{{ sec.title }}</h2>
        <p class="proj-sec-body">{{ sec.body }}</p>
      </section>

      <nav class="proj-foot" aria-label="项目导航">
        <router-link to="/projects" class="proj-back">全部项目</router-link>
        <router-link v-if="next" :to="`/projects/${next.slug}`" class="proj-next">
          下一个：{{ next.name }}
        </router-link>
      </nav>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { findProject, projects } from '../../data/projects.js'

const route = useRoute()
const project = computed(() => findProject(String(route.params.slug || '')))
const next = computed(() => {
  if (!project.value) return null
  const i = projects.findIndex((p) => p.slug === project.value.slug)
  return i >= 0 && i + 1 < projects.length ? projects[i + 1] : null
})
</script>

<style scoped>
.proj-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.proj-main { max-width: 820px; margin: 0 auto; padding: 64px 24px 104px; }

.proj-head { padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.proj-kicker { margin: 0 0 8px; font-size: 0.75rem; letter-spacing: .08em; color: var(--text-dim); }
.proj-title {
  margin: 0; font-size: clamp(1.875rem, 4vw, 2.75rem); font-weight: 700;
  letter-spacing: -0.025em; color: var(--text-bright); text-wrap: balance;
}
.proj-sub { margin: 8px 0 0; font-size: 0.9375rem; line-height: 1.6; color: var(--text-secondary); }
.proj-meta {
  display: flex; align-items: center; gap: 12px; margin: 14px 0 0;
  font-size: 0.7812rem; color: var(--text-faint); font-variant-numeric: tabular-nums;
}
.proj-status {
  color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
  padding: 1px 8px; border-radius: 999px; font-size: 0.7188rem;
}
.proj-summary { margin: 16px 0 0; font-size: 0.9062rem; line-height: 1.8; color: var(--text); max-width: 70ch; }
.proj-stack { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 0; padding: 0; list-style: none; }
.proj-stack li {
  font-size: 0.7188rem; color: var(--text-dim); padding: 2px 9px;
  border: 1px solid var(--border); border-radius: 999px;
  font-family: ui-monospace, monospace;
}
.proj-links { margin: 16px 0 0; font-size: 0.8125rem; }
.proj-link {
  color: var(--accent); text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
}
.proj-link:hover { border-bottom-color: var(--accent); }
.proj-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 2px; }
.proj-link-sep { color: var(--text-faint); margin: 0 8px; }

.proj-sec { margin-top: 32px; }
.proj-sec-title {
  margin: 0 0 10px; font-size: 1.0625rem; font-weight: 650; color: var(--text-bright);
  padding-bottom: 8px; border-bottom: 1px solid var(--border);
}
.proj-sec-body { margin: 0; font-size: 0.9062rem; line-height: 1.85; color: var(--text-secondary); max-width: 72ch; }

.proj-foot {
  display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
  margin-top: 44px; padding-top: 20px; border-top: 1px solid var(--border); flex-wrap: wrap;
}
.proj-back, .proj-next { font-size: 0.8125rem; color: var(--text-dim); text-decoration: none; border-bottom: 1px solid var(--border-strong); }
.proj-back:hover, .proj-next:hover { color: var(--accent); border-color: var(--accent); }

@media (max-width: 720px) {
  .proj-main { padding: 40px 20px 72px; }
  .proj-sec { margin-top: 26px; }
}
</style>
