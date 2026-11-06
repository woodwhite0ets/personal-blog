<template>
  <section v-if="items.length" class="ai-snip">
    <div class="ai-snip-head">
      <h2 class="hm-h">AI 项目榜</h2>
      <router-link class="ai-snip-more" to="/ai-daily">完整榜单</router-link>
    </div>
    <p class="ai-snip-sub">按 24 小时 Star 增量排榜，中文介绍由本机模型生成。{{ date ? `最新一期 ${date}` : '' }}</p>

    <ol class="ai-snip-list">
      <li
        v-for="(item, i) in items" :key="item.repo"
        class="ai-snip-item" :class="{ lead: i === 0 }"
      >
        <span class="ai-snip-rank" aria-hidden="true">{{ String(item.rank).padStart(2, '0') }}</span>
        <div class="ai-snip-body">
          <a class="ai-snip-name" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.repo }}</a>
          <p class="ai-snip-desc">{{ item.desc_zh || item.desc_en || '' }}</p>
        </div>
        <span class="ai-snip-stat">
          <template v-if="item.star_gain > 0">+{{ formatNumber(item.star_gain) }}</template>
          <template v-else>★ {{ formatNumber(item.stars) }}</template>
        </span>
      </li>
    </ol>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const items = ref([])
const date = ref('')

function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US')
}

onMounted(async () => {
  try {
    const res = await fetch('/api/ai-daily/latest?limit=5')
    if (!res.ok) return
    const data = await res.json()
    items.value = data.items || []
    date.value = data.date || ''
  } catch (err) {
    // 首页装饰性板块：接口失败时不渲染，不打扰主内容
    console.warn('AI 项目榜简讯加载失败:', err)
  }
})
</script>

<style scoped>
.ai-snip { padding: 0 0 8px; }
.ai-snip-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.ai-snip-head .hm-h { flex: 1; margin-bottom: 6px; }
.ai-snip-more {
  font-size: 0.7812rem; color: var(--text-dim); text-decoration: none;
  border-bottom: 1px solid var(--border-strong); padding-bottom: 1px;
  white-space: nowrap;
}
.ai-snip-more:hover { color: var(--text-bright); border-color: var(--text-bright); }
.ai-snip-more:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px; }
.ai-snip-sub { margin: 0 0 10px; font-size: 0.7812rem; color: var(--text-dim); }

.ai-snip-list { list-style: none; margin: 0; padding: 0; }
.ai-snip-item {
  display: grid; grid-template-columns: 30px 1fr auto; gap: 0 14px;
  align-items: baseline; padding: 10px 2px; border-top: 1px solid var(--border);
}
.ai-snip-item:last-child { border-bottom: none; }
.ai-snip-rank {
  font-family: var(--font-mono);
  font-size: 0.6875rem; letter-spacing: .06em; color: var(--text-faint); font-variant-numeric: tabular-nums;
}

/* 第一名：整段唯一的峰值，字号与间距都拉开，其余四行保持安静 */
.ai-snip-item.lead {
  grid-template-columns: 1fr auto;
  gap: 0 16px;
  padding: 6px 2px 20px;
  border-top: none;
  margin-bottom: 4px;
}
.ai-snip-item.lead .ai-snip-rank {
  display: none;
}
.ai-snip-item.lead .ai-snip-name {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
}
.ai-snip-item.lead .ai-snip-desc {
  margin-top: 8px;
  font-size: 0.9375rem;
  line-height: 1.6;
  -webkit-line-clamp: 2; line-clamp: 2;
  color: var(--text-secondary);
}
.ai-snip-item.lead .ai-snip-stat {
  font-size: 0.9375rem;
}
.ai-snip-body { min-width: 0; }
.ai-snip-name {
  display: block; font-size: 0.875rem; font-weight: 650; color: var(--text-bright);
  text-decoration: none; word-break: break-word;
}
.ai-snip-name:hover { color: var(--text-secondary); }
.ai-snip-name:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px; }
.ai-snip-desc {
  margin: 3px 0 0; font-size: 0.7812rem; line-height: 1.55; color: var(--text-secondary);
  display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical;
  overflow: hidden;
}
.ai-snip-stat {
  font-family: var(--font-mono);
  font-size: 0.75rem; color: var(--ok); font-variant-numeric: tabular-nums;
  font-weight: 600; white-space: nowrap; letter-spacing: .02em;
}

@media (max-width: 720px) {
  .ai-snip-item { grid-template-columns: 26px 1fr; }
  .ai-snip-stat { grid-column: 2; margin-top: 4px; }
}

/* 动效：进视口时逐行升起（滚动驱动，纯 CSS）+ hover 右移 3px */
@keyframes snipRow {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@supports (animation-timeline: view()) {
  .ai-snip-item {
    animation: snipRow linear both;
    animation-timeline: view();
    animation-range: entry 5% entry 22%;
  }
}
.ai-snip-item {
  transition: background-color var(--dur-hover) var(--ease-out), translate var(--dur-hover) var(--ease-out);
}
.ai-snip-item:hover { translate: 3px 0; background: var(--overlay-a2); }
@media (prefers-reduced-motion: reduce) {
  .ai-snip-item { animation: none !important; }
  .ai-snip-item:hover { translate: none; }
}
</style>
