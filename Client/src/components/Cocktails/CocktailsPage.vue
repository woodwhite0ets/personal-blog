<template>
  <div class="ct-page">
    <div class="page-wash" aria-hidden="true"></div>
    <SiteNav />

    <!-- 单杯 -->
    <main v-if="current" class="ct-main">
      <router-link class="ct-back" to="/cocktails">← 全部配方</router-link>

      <header class="ct-head">
        <p class="ct-kicker">{{ current.base }} · {{ current.method }}</p>
        <h1 class="ct-title">{{ current.nameZh || current.name }}</h1>
        <p v-if="current.nameZh" class="ct-alias">{{ current.name }}</p>
        <dl class="ct-facts">
          <div><dt>杯型</dt><dd>{{ current.glass || '—' }}</dd></div>
          <div><dt>做法</dt><dd>{{ current.method }}</dd></div>
          <div><dt>酒精度</dt><dd>{{ current.alcoholic }}</dd></div>
          <div v-if="current.since"><dt>记录自</dt><dd>{{ current.since }}</dd></div>
        </dl>
      </header>

      <section class="ct-sec">
        <h2 class="ct-h2">材料</h2>
        <ul class="ct-ingredients">
          <li v-for="(ing, i) in current.ingredients" :key="i">
            <span class="ct-ing-name">{{ ing[0] }}</span>
            <span class="ct-ing-amount">{{ ing[1] || '适量' }}</span>
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

      <p v-if="current.tags && current.tags.length" class="ct-tags">
        <span v-for="t in current.tags" :key="t" class="ct-tag">{{ t }}</span>
      </p>

      <nav v-if="next" class="ct-next" aria-label="下一杯">
        <span class="ct-next-k">下一杯</span>
        <router-link :to="`/cocktails/${next.slug}`" class="ct-next-link">{{ next.nameZh || next.name }} <span aria-hidden="true">→</span></router-link>
      </nav>
    </main>

    <!-- 索引 -->
    <main v-else class="ct-main">
      <header class="ct-head">
        <p class="ct-kicker">配方库</p>
        <h1 class="ct-title">调酒</h1>
        <p class="ct-lead">
          收录 {{ total }} 杯：材料、用量、做法、杯型。<span v-if="curatedCount">其中 {{ curatedCount }} 杯是自己做过的，写了备注；</span>
          其余来自公开配方库，做法为官方中文译文。
        </p>
      </header>

      <div class="ct-toolbar">
        <label class="ct-search">
          <span class="sr-only">搜索配方</span>
          <input v-model="q" type="search" placeholder="搜配方或材料，比如 negroni / 金酒 / 青柠" autocomplete="off" />
        </label>
        <div class="ct-filters" role="group" aria-label="筛选">
          <button
            v-for="b in ['全部', ...bases]" :key="b" type="button"
            class="ct-filter" :class="{ active: base === (b === '全部' ? '' : b) }"
            :aria-pressed="base === (b === '全部' ? '' : b)"
            @click="base = b === '全部' ? '' : b"
          >{{ b }}</button>
        </div>
      </div>

      <p class="ct-count">
        <template v-if="loading">正在加载配方…</template>
        <template v-else>{{ filtered.length }} 条<template v-if="filtered.length !== total"> / 共 {{ total }} 条</template></template>
      </p>

      <ul v-if="!loading" class="ct-list">
        <li v-for="c in paged" :key="c.slug">
          <router-link :to="`/cocktails/${c.slug}`" class="ct-item">
            <span class="ct-item-head">
              <span class="ct-item-name">{{ c.nameZh || c.name }}</span>
              <span v-if="c.nameZh" class="ct-item-alias">{{ c.name }}</span>
              <span class="ct-item-base">{{ c.base }}</span>
              <span v-if="c.curated" class="ct-item-pin">做过</span>
            </span>
            <span class="ct-item-meta">
              <span>{{ c.method }}</span>
              <span v-if="c.glass">{{ c.glass }}</span>
              <span class="ct-item-tags">{{ (c.tags || []).slice(0, 3).join(' · ') }}</span>
            </span>
          </router-link>
        </li>
      </ul>

      <div v-if="!loading && paged.length < filtered.length" class="ct-more">
        <button type="button" class="ct-more-btn" @click="shown += PAGE">再加载 {{ Math.min(PAGE, filtered.length - paged.length) }} 条</button>
      </div>

      <p v-if="!loading && !filtered.length" class="ct-note">没有匹配的配方，换个词试试。</p>

      <p v-if="!loading" class="ct-note">
        配方数据来自 <a href="https://www.thecocktaildb.com" target="_blank" rel="noopener noreferrer">TheCocktailDB</a>，中文做法为官方译文；
        标「做过」的是我自己校订过比例与备注的。
      </p>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { cocktails as curated } from '../../data/cocktails.js'
import { SITE } from '../../data/routeMeta.js'
import { applyPageMeta } from '../../utils/seo.js'
const PAGE = 30

const route = useRoute()
const catalog = ref([])
const loading = ref(true)
const q = ref('')
const base = ref('')
const shown = ref(PAGE)


onMounted(async () => {
  try {
    const res = await fetch('/cocktails.json')
    const json = await res.json()
    catalog.value = json.drinks || []
  } catch {
    catalog.value = []
  } finally {
    loading.value = false
  }
})

// 手工校订的几杯覆盖同 slug 的导入条目；排序先校订、再中文名、最后按名称
const all = computed(() => {
  const mine = curated.map((c) => ({
    slug: c.slug, name: c.alias, nameZh: c.name, base: c.base, method: c.method, glass: c.glass,
    alcoholic: '含酒精', tags: c.tags, ingredients: c.ingredients.map((i) => [i.name, i.amount]),
    steps: c.steps, notes: c.notes, since: c.since, curated: true,
  }))
  const mineSlugs = new Set(mine.map((c) => c.slug))
  const rest = catalog.value.filter((c) => !mineSlugs.has(c.slug))
  rest.sort((a, b) => {
    const az = a.nameZh ? 0 : 1
    const bz = b.nameZh ? 0 : 1
    return az !== bz ? az - bz : (a.nameZh || a.name).localeCompare(b.nameZh || b.name, 'zh')
  })
  return mine.concat(rest)
})

const bases = computed(() => [...new Set(all.value.map((c) => c.base))].filter(Boolean))
const total = computed(() => all.value.length)
const curatedCount = computed(() => curated.length)

const filtered = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return all.value.filter((c) => {
    if (base.value && c.base !== base.value) return false
    if (!needle) return true
    const hay = [c.name, c.nameZh, c.base, ...(c.ingredients || []).map((i) => i[0])].join(' ').toLowerCase()
    return hay.includes(needle)
  })
})
const paged = computed(() => filtered.value.slice(0, shown.value))
watch([q, base], () => { shown.value = PAGE })

const current = computed(() => (route.params.slug ? all.value.find((c) => c.slug === String(route.params.slug)) || null : null))
const next = computed(() => {
  if (!current.value) return null
  const list = all.value
  const i = list.findIndex((c) => c.slug === current.value.slug)
  return i >= 0 && i + 1 < list.length ? list[i + 1] : null
})

watchEffect(() => {
  if (current.value) {
    const c = current.value
    const ings = (c.ingredients || []).map((i) => `${i[0]} ${i[1] || ''}`.trim()).join('、')
    applyPageMeta({
      title: `${c.nameZh || c.name}${c.nameZh ? `（${c.name}）` : ''} — 调酒 · 木白`,
      description: `${c.nameZh || c.name}的做法：${ings}。${c.method}，${c.glass || '杯型不限'}。`,
      canonical: `${SITE.blog}/cocktails/${c.slug}`,
    })
  } else if (route.params.slug && !loading.value) {
    applyPageMeta({
      title: '没有这杯 — 调酒 · 木白',
      description: '这个配方还没有收录。',
      canonical: `${SITE.blog}/cocktails`,
    })
  }
})
</script>

<style scoped>
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.ct-page { min-height: 100dvh; background-color: var(--bg); color: var(--text); overflow-x: clip; }
.ct-main { max-width: var(--page-w); margin: 0 auto; padding: 64px var(--page-pad) 104px; }

.ct-head { padding-bottom: 28px; border-bottom: 1px solid var(--border); }
.ct-kicker { margin: 0 0 10px; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: .08em; color: var(--text-faint); }
.ct-title { margin: 0; font-family: var(--font-display); font-weight: 650; letter-spacing: -0.035em; line-height: 1.1; color: var(--text-bright); text-wrap: balance; }
.ct-alias { margin: 8px 0 0; font-family: var(--font-mono); font-size: 0.9375rem; letter-spacing: .02em; color: var(--text-dim); }
.ct-lead { margin: 14px 0 0; max-width: 40em; font-size: 1rem; line-height: 1.75; color: var(--text-secondary); text-wrap: pretty; }

.ct-facts { display: flex; flex-wrap: wrap; gap: 0; margin: 26px 0 0; }
.ct-facts > div { padding: 0 28px 0 0; margin: 0 28px 12px 0; border-right: 1px solid var(--border); }
.ct-facts > div:last-child { border-right: none; margin-right: 0; padding-right: 0; }
.ct-facts dt { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: .04em; color: var(--text-faint); margin-bottom: 4px; }
.ct-facts dd { margin: 0; font-size: 0.9375rem; color: var(--text-bright); }

/* 工具条：搜索 + 基酒筛选 */
.ct-toolbar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 24px 0 0; }
.ct-search { flex: 1 1 260px; }
.ct-search input {
  width: 100%; height: 40px; padding: 0 12px; font: inherit; font-size: 0.9375rem;
  color: var(--text); background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 10px;
  transition: border-color var(--dur-hover) var(--ease-out);
}
.ct-search input::placeholder { color: var(--text-faint); }
.ct-search input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }

.ct-filters { display: flex; gap: 8px; flex-wrap: wrap; }
.ct-filter {
  height: 34px; padding: 0 12px; font: inherit; font-size: 0.8125rem;
  color: var(--text-secondary); background: none; border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer;
  transition: color var(--dur-hover) var(--ease-out), border-color var(--dur-hover) var(--ease-out), background-color var(--dur-hover) var(--ease-out);
}
.ct-filter:hover { color: var(--text-bright); border-color: var(--border-strong); }
.ct-filter.active { color: var(--on-accent); background: var(--accent); border-color: var(--accent); }
.ct-filter:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.ct-count { margin: 16px 0 0; font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-faint); }

/* 清单 */
.ct-list { list-style: none; margin: 8px 0 0; padding: 0; }
.ct-item {
  display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 16px;
  padding: 16px 12px; margin: 0 -12px; border-bottom: 1px solid var(--border);
  text-decoration: none; transition: background-color var(--dur-hover) var(--ease-out);
}
.ct-item:hover { background: var(--surface-2); }
.ct-item:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.ct-item-head { display: flex; align-items: baseline; gap: 10px; min-width: 0; flex-wrap: wrap; }
.ct-item-name { font-family: var(--font-display); font-size: 1.0625rem; font-weight: 600; letter-spacing: -0.015em; color: var(--text-bright); }
.ct-item-alias { font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-dim); }
.ct-item-base {
  font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-secondary);
  border: 1px solid var(--border-strong); border-radius: 4px; padding: 1px 6px; white-space: nowrap;
}
.ct-item-pin { font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent); }
.ct-item-meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 14px; margin-left: auto; font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-faint); letter-spacing: .02em; }
.ct-item-tags { color: var(--text-secondary); }

.ct-more { display: flex; justify-content: center; margin: 28px 0 0; }
.ct-more-btn {
  height: 40px; padding: 0 20px; font: inherit; font-size: 0.875rem;
  color: var(--text-bright); background: none; border: 1px solid var(--border-strong);
  border-radius: 10px; cursor: pointer; transition: border-color var(--dur-hover) var(--ease-out), background-color var(--dur-hover) var(--ease-out);
}
.ct-more-btn:hover { border-color: var(--text-bright); background: var(--surface-2); }
.ct-note { margin: 24px 0 0; font-size: 0.875rem; line-height: 1.7; color: var(--text-faint); }
.ct-note a { color: var(--text-secondary); text-decoration: underline; text-underline-offset: 2px; }

/* 单杯 */
.ct-back { display: inline-flex; align-items: center; min-height: 32px; font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-dim); text-decoration: none; }
.ct-back:hover { color: var(--accent); }
.ct-sec { margin-top: 44px; }
.ct-h2 { margin: 0 0 16px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: .1em; color: var(--text-faint); }
.ct-ingredients { list-style: none; margin: 0; padding: 0; max-width: 34em; }
.ct-ingredients li { display: flex; align-items: baseline; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.ct-ingredients li:first-child { border-top: 1px solid var(--border); }
.ct-ing-name { font-size: 0.9375rem; color: var(--text-bright); }
.ct-ing-amount { margin-left: auto; font-family: var(--font-mono); font-size: 0.875rem; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.ct-steps { margin: 0; padding: 0 0 0 1.25em; max-width: 38em; display: flex; flex-direction: column; gap: 12px; }
.ct-steps li { font-size: 0.9375rem; line-height: 1.75; color: var(--text-secondary); }
.ct-steps li::marker { color: var(--text-faint); font-family: var(--font-mono); font-size: 0.8125rem; }
.ct-notes { margin: 0; max-width: 38em; font-size: 0.9375rem; line-height: 1.8; color: var(--text-secondary); text-wrap: pretty; }
.ct-tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 28px 0 0; }
.ct-tag { font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; }

.ct-next { display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap; margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--border); }
.ct-next-k { font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: .08em; color: var(--text-faint); }
.ct-next-link { display: inline-flex; align-items: center; min-height: 32px; font-family: var(--font-display); font-size: 1rem; font-weight: 600; color: var(--text-bright); text-decoration: none; }
.ct-next-link:hover { color: var(--accent); }

@media (max-width: 720px) {
  .ct-main { padding: 40px 20px 80px; }
  .ct-facts > div { padding-right: 18px; margin-right: 18px; }
  .ct-item { padding: 14px 0; margin: 0; }
  .ct-item-meta { margin-left: 0; width: 100%; gap: 12px; }
  .ct-search { flex-basis: 100%; }
}
</style>
