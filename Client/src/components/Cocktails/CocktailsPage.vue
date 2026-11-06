<template>
  <div class="ct-page">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav />

    <!-- 单条配方 -->
    <main v-if="current" class="ct-main">
      <router-link class="ct-back" to="/cocktails">← 全部配方</router-link>

      <header class="ct-head">
        <p class="ct-kicker">{{ current.base }} · {{ current.method }}</p>
        <h1 class="ct-title">{{ current.name }}</h1>
        <p class="ct-alias">{{ current.alias }}</p>
        <dl class="ct-facts">
          <div><dt>杯型</dt><dd>{{ current.glass }}</dd></div>
          <div><dt>烈度</dt><dd>{{ '●'.repeat(current.strength) }}{{ '○'.repeat(5 - current.strength) }}</dd></div>
          <div><dt>出杯</dt><dd>{{ current.time }}</dd></div>
          <div><dt>记录自</dt><dd>{{ current.since }}</dd></div>
        </dl>
      </header>

      <section class="ct-sec">
        <h2 class="ct-h2">材料</h2>
        <ul class="ct-ingredients">
          <li v-for="ing in current.ingredients" :key="ing.name">
            <span class="ct-ing-name">{{ ing.name }}</span>
            <span class="ct-ing-amount">{{ ing.amount }}</span>
          </li>
        </ul>
      </section>

      <section class="ct-sec">
        <h2 class="ct-h2">做法</h2>
        <ol class="ct-steps">
          <li v-for="(s, i) in current.steps" :key="i">{{ s }}</li>
        </ol>
      </section>

      <section v-if="current.notes" class="ct-sec">
        <h2 class="ct-h2">备注</h2>
        <p class="ct-notes">{{ current.notes }}</p>
      </section>

      <nav v-if="next" class="ct-next" aria-label="下一杯">
        <span class="ct-next-k">下一杯</span>
        <router-link :to="`/cocktails/${next.slug}`" class="ct-next-link">{{ next.name }} <span aria-hidden="true">→</span></router-link>
      </nav>
    </main>

    <!-- 索引 -->
    <main v-else class="ct-main">
      <header class="ct-head">
        <p class="ct-kicker">家里那点工具能做的</p>
        <h1 class="ct-title">调酒</h1>
        <p class="ct-lead">
          一共 {{ cocktails.length }} 杯，都是自己做过、能复现的配方。比例写的是基准，
          实际会按酒和口味微调，备注里记了为什么这么改。
        </p>
      </header>

      <div class="ct-filters" role="group" aria-label="按基酒筛选">
        <button
          type="button" class="ct-filter" :class="{ active: activeBase === '' }"
          :aria-pressed="activeBase === ''" @click="activeBase = ''"
        >全部</button>
        <button
          v-for="b in bases" :key="b" type="button"
          class="ct-filter" :class="{ active: activeBase === b }"
          :aria-pressed="activeBase === b"
          @click="activeBase = activeBase === b ? '' : b"
        >{{ b }}</button>
      </div>

      <ul class="ct-list">
        <li v-for="c in filtered" :key="c.slug">
          <router-link :to="`/cocktails/${c.slug}`" class="ct-item">
            <span class="ct-item-head">
              <span class="ct-item-name">{{ c.name }}</span>
              <span class="ct-item-alias">{{ c.alias }}</span>
              <span class="ct-item-base">{{ c.base }}</span>
            </span>
            <span class="ct-item-meta">
              <span>{{ c.method }}</span>
              <span>{{ c.glass }}</span>
              <span>{{ '●'.repeat(c.strength) }}{{ '○'.repeat(5 - c.strength) }}</span>
              <span class="ct-item-tags">{{ c.tags.join(' · ') }}</span>
            </span>
          </router-link>
        </li>
      </ul>

      <p class="ct-note">比例是基准，不是规矩。同一杯在不同酒上差很多，先按这个做再调。</p>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { cocktails, findCocktail, bases } from '../../data/cocktails.js'
import { SITE } from '../../data/routeMeta.js'
import { applyPageMeta } from '../../utils/seo.js'

const route = useRoute()
const activeBase = ref('')

const current = computed(() => (route.params.slug ? findCocktail(String(route.params.slug)) : null))
const filtered = computed(() => (activeBase.value ? cocktails.filter((c) => c.base === activeBase.value) : cocktails))
const next = computed(() => {
  if (!current.value) return null
  const i = cocktails.findIndex((c) => c.slug === current.value.slug)
  return i >= 0 && i + 1 < cocktails.length ? cocktails[i + 1] : null
})

watchEffect(() => {
  if (current.value) {
    applyPageMeta({
      title: `${current.value.name}（${current.value.alias}）— 调酒 · 木白`,
      description: `${current.value.name}的做法：${current.value.ingredients.map((i) => `${i.name} ${i.amount}`).join('、')}。${current.value.method}，${current.value.glass}。`,
      canonical: `${SITE.blog}/cocktails/${current.value.slug}`,
    })
  } else if (route.params.slug) {
    applyPageMeta({
      title: '没有这杯 — 调酒 · 木白',
      description: '这个配方还没有记录。',
      canonical: `${SITE.blog}/cocktails`,
    })
  }
})
</script>

<style scoped>
.ct-page { min-height: 100dvh; background-color: var(--bg); color: var(--text); overflow-x: clip; }
.ct-main { max-width: var(--page-w); margin: 0 auto; padding: 64px var(--page-pad) 104px; }

.ct-head { padding-bottom: 28px; border-bottom: 1px solid var(--border); }
.ct-kicker { margin: 0 0 10px; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: .08em; color: var(--text-faint); }
.ct-title { margin: 0; font-family: var(--font-display); font-weight: 650; letter-spacing: -0.035em; line-height: 1.1; color: var(--text-bright); text-wrap: balance; }
.ct-alias { margin: 8px 0 0; font-family: var(--font-mono); font-size: 0.9375rem; letter-spacing: .02em; color: var(--text-dim); }
.ct-lead { margin: 14px 0 0; max-width: 36em; font-size: 1rem; line-height: 1.75; color: var(--text-secondary); text-wrap: pretty; }

/* 事实栏：配方页的抬头信息 */
.ct-facts { display: flex; flex-wrap: wrap; gap: 0; margin: 26px 0 0; }
.ct-facts > div { padding: 0 28px 0 0; margin: 0 28px 12px 0; border-right: 1px solid var(--border); }
.ct-facts > div:last-child { border-right: none; margin-right: 0; padding-right: 0; }
.ct-facts dt { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: .04em; color: var(--text-faint); margin-bottom: 4px; }
.ct-facts dd { margin: 0; font-size: 0.9375rem; color: var(--text-bright); letter-spacing: .06em; }

/* 索引：一行一杯，悬停整行点亮 */
.ct-filters { display: flex; gap: 8px; flex-wrap: wrap; margin: 24px 0 4px; }
.ct-filter {
  height: 34px; padding: 0 14px; font: inherit; font-size: 0.875rem;
  color: var(--text-secondary); background: none; border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer;
  transition: color var(--dur-hover) var(--ease-out), border-color var(--dur-hover) var(--ease-out), background-color var(--dur-hover) var(--ease-out);
}
.ct-filter:hover { color: var(--text-bright); border-color: var(--border-strong); }
.ct-filter.active { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
.ct-filter:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.ct-list { list-style: none; margin: 0; padding: 0; }
.ct-item {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 16px;
  padding: 20px 12px; margin: 0 -12px; border-bottom: 1px solid var(--border);
  text-decoration: none; transition: background-color var(--dur-hover) var(--ease-out);
}
.ct-item:hover { background: var(--surface-2); }
.ct-item:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.ct-item-head { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.ct-item-name { font-family: var(--font-display); font-size: 1.125rem; font-weight: 600; letter-spacing: -0.015em; color: var(--text-bright); }
.ct-item-alias { font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-dim); }
.ct-item-base {
  font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 28%, transparent); border-radius: 4px; padding: 1px 6px;
}
.ct-item-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 14px; margin-left: auto; font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-faint); letter-spacing: .02em; }
.ct-item-tags { color: var(--text-secondary); }
.ct-note { margin: 24px 0 0; font-size: 0.875rem; line-height: 1.7; color: var(--text-faint); }

/* 单条配方 */
.ct-back { display: inline-flex; align-items: center; min-height: 32px; font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-dim); text-decoration: none; }
.ct-back:hover { color: var(--accent); }
.ct-sec { margin-top: 48px; }
.ct-h2 { margin: 0 0 16px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: .1em; color: var(--text-faint); }
.ct-ingredients { list-style: none; margin: 0; padding: 0; max-width: 34em; }
.ct-ingredients li { display: flex; align-items: baseline; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.ct-ingredients li:first-child { border-top: 1px solid var(--border); }
.ct-ing-name { font-size: 0.9375rem; color: var(--text-bright); }
.ct-ing-amount { margin-left: auto; font-family: var(--font-mono); font-size: 0.875rem; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.ct-steps { margin: 0; padding: 0 0 0 1.25em; max-width: 36em; display: flex; flex-direction: column; gap: 12px; }
.ct-steps li { font-size: 0.9375rem; line-height: 1.75; color: var(--text-secondary); }
.ct-steps li::marker { color: var(--text-faint); font-family: var(--font-mono); font-size: 0.8125rem; }
.ct-notes { margin: 0; max-width: 36em; font-size: 0.9375rem; line-height: 1.8; color: var(--text-secondary); text-wrap: pretty; }

.ct-next { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-top: 64px; padding-top: 20px; border-top: 1px solid var(--border); }
.ct-next-k { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: .08em; color: var(--text-faint); }
.ct-next-link { display: inline-flex; align-items: center; min-height: 32px; font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: var(--text-bright); text-decoration: none; }
.ct-next-link:hover { color: var(--accent); }

@media (max-width: 720px) {
  .ct-main { padding: 40px 20px 80px; }
  .ct-facts > div { padding-right: 18px; margin-right: 18px; }
  .ct-item { padding: 16px 0; margin: 0; }
  .ct-item-meta { margin-left: 0; width: 100%; gap: 12px; }
}
</style>
