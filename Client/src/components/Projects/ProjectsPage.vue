<template>
  <div class="pl-page">
    <SiteNav />

    <main class="pl-main">
      <header class="pl-head">
        <p class="pl-kicker">项目</p>
        <h1 class="pl-title">做过的东西</h1>
        <p class="pl-lead">都在自己机器上跑过、交付过。每条写清它在解决什么问题，细节在文章里。</p>
      </header>

      <ul class="pl-list">
        <li v-for="p in projects" :key="p.slug" class="pl-item">
          <router-link :to="`/projects/${p.slug}`" class="pl-link">
            <div class="pl-line">
              <span class="pl-name">{{ p.name }}</span>
              <span class="pl-status">{{ p.status }}</span>
              <time class="pl-period">{{ p.period }}</time>
            </div>
            <p class="pl-sub">{{ p.subtitle }}</p>
            <p class="pl-summary">{{ p.summary }}</p>
            <p class="pl-stack">{{ p.stack.join(' · ') }}</p>
          </router-link>
        </li>
      </ul>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { projects } from '../../data/projects.js'
</script>

<style scoped>
.pl-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.pl-main { max-width: 1080px; margin: 0 auto; padding: 64px 24px 104px; }
.pl-head { padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.pl-kicker { margin: 0 0 8px; font-size: 0.75rem; letter-spacing: .08em; color: var(--text-dim); }
.pl-title {
  margin: 0; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700;
  letter-spacing: -0.025em; color: var(--text-bright);
}
.pl-lead { margin: 12px 0 0; max-width: 64ch; font-size: 0.875rem; line-height: 1.75; color: var(--text-secondary); }

.pl-list { list-style: none; margin: 0; padding: 0; }
.pl-item { border-bottom: 1px solid var(--border); }
.pl-link { display: block; padding: 22px 2px; text-decoration: none; }
.pl-link:hover .pl-name { color: var(--accent); }
.pl-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
.pl-line { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.pl-name { font-size: 1.0625rem; font-weight: 650; color: var(--text-bright); }
.pl-status {
  font-size: 0.6875rem; color: var(--text-dim); padding: 1px 8px;
  border: 1px solid var(--border); border-radius: 999px;
}
.pl-period { margin-left: auto; font-size: 0.75rem; color: var(--text-faint); font-variant-numeric: tabular-nums; }
.pl-sub { margin: 6px 0 0; font-size: 0.8438rem; color: var(--text-secondary); }
.pl-summary { margin: 8px 0 0; font-size: 0.8438rem; line-height: 1.7; color: var(--text-secondary); max-width: 80ch; }
.pl-stack { margin: 8px 0 0; font-size: 0.6875rem; color: var(--text-faint); font-family: ui-monospace, monospace; }

@media (max-width: 720px) {
  .pl-main { padding: 40px 20px 72px; }
  .pl-period { margin-left: 0; }
}
</style>
