<template>
  <CompanyShell>
    <div class="co-main co-page--work">
      <CompanyMasthead
        title="案例库"
        :lead="`${cases.length} 个项目在生产环境运行，按类型筛。每个都写了问题、做法与结果。`"
        :meta="[
          { k: '在运行', v: `${cases.length} 个` },
          { k: '最早', v: '2026.07' },
          { k: '最新', v: '2026.10' },
        ]"
      />

      <!-- 素材库形态的工具栏：分类带计数、排序、列数 -->
      <div class="co-lib-bar" role="group" aria-label="案例筛选">
        <div class="co-lib-chips">
          <button
            v-for="c in chips"
            :key="c.kind"
            class="co-lib-chip"
            :class="{ 'is-on': filter === c.kind }"
            :aria-pressed="filter === c.kind"
            @click="filter = c.kind"
          >
            {{ c.kind }}<span class="co-lib-n">{{ c.n }}</span>
          </button>
        </div>
        <div class="co-lib-tools">
          <button class="co-lib-toggle" :class="{ 'is-on': sort === 'recent' }" :aria-pressed="sort === 'recent'" @click="sort = 'recent'">最近优先</button>
          <button class="co-lib-toggle" :class="{ 'is-on': sort === 'name' }" :aria-pressed="sort === 'name'" @click="sort = 'name'">按名称</button>
          <span class="co-lib-sep" aria-hidden="true"></span>
          <button class="co-lib-col" :aria-pressed="cols === 3" @click="cols = 3">3 列</button>
          <button class="co-lib-col" :aria-pressed="cols === 4" @click="cols = 4">4 列</button>
        </div>
      </div>

      <ul class="co-lib" :class="`co-lib--${cols}`">
        <li v-for="p in shown" :key="p.slug">
          <router-link :to="`/work/${p.slug}`" class="co-lib-card">
            <span class="co-lib-thumb"><CaseFigure :slug="p.slug" size="md" /></span>
            <span class="co-lib-body">
              <span class="co-lib-top">
                <span class="co-lib-kind">{{ p.kind }}</span>
                <span class="co-lib-period">{{ p.period }}</span>
              </span>
              <span class="co-lib-name">{{ p.name }}</span>
              <span class="co-lib-sub">{{ p.subtitle }}</span>
              <span class="co-lib-result">{{ p.result }}</span>
            </span>
          </router-link>
        </li>
      </ul>
      <p v-if="!shown.length" class="co-note">这个分类下暂时没有项目。</p>

      <section class="co-sec">
        <CompanyCta
          title="你的问题在不在这些案例里"
          note="说清现在卡在哪，我先判断值不值得做，不收费。"
          hint="写清背景和目标就行，一般一天内回。"
        />
      </section>
    </div>
  </CompanyShell>
</template>

<script setup>
// 案例库：按素材库的方式组织——分类带计数、排序、列数可调，一屏能看完。
// 数据只在 projects.js 里，这里不复制任何项目文案。
import { ref, computed } from 'vue'
import CompanyShell from './CompanyShell.vue'
import CompanyMasthead from './CompanyMasthead.vue'
import CompanyCta from './CompanyCta.vue'
import CaseFigure from './CaseFigure.vue'
import { projects } from '../../data/projects.js'

const cases = projects
const filter = ref('全部')
const sort = ref('recent')
const cols = ref(3)

const chips = computed(() => {
  const map = new Map()
  cases.forEach((p) => map.set(p.kind || '其他', (map.get(p.kind || '其他') || 0) + 1))
  return [{ kind: '全部', n: cases.length }, ...[...map].map(([kind, n]) => ({ kind, n }))]
})

const shown = computed(() => {
  const list = cases.filter((p) => filter.value === '全部' || p.kind === filter.value)
  const sorted = [...list]
  if (sort.value === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  else sorted.sort((a, b) => String(b.period).localeCompare(String(a.period)))
  return sorted
})
</script>
