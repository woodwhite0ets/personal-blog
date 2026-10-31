<template>
  <section v-if="items.length" class="ai-snip">
    <div class="ai-snip-head">
      <h2 class="hm-h">AI 项目榜</h2>
      <router-link class="ai-snip-more" to="/ai-daily">完整榜单</router-link>
    </div>
    <p class="ai-snip-sub">按 24 小时 Star 增量排榜，中文介绍由本机模型生成。{{ date ? `最新一期 ${date}` : '' }}</p>

    <ol class="ai-snip-list">
      <li v-for="item in items" :key="item.repo" class="ai-snip-item">
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
  font-size: 12.5px; color: var(--text-dim); text-decoration: none;
  border-bottom: 1px solid var(--border-strong); padding-bottom: 1px;
  white-space: nowrap;
}
.ai-snip-more:hover { color: var(--accent); border-color: var(--accent); }
.ai-snip-more:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px; }
.ai-snip-sub { margin: 0 0 10px; font-size: 12.5px; color: var(--text-dim); }

.ai-snip-list { list-style: none; margin: 0; padding: 0; }
.ai-snip-item {
  display: grid; grid-template-columns: 30px 1fr auto; gap: 0 14px;
  align-items: baseline; padding: 10px 2px; border-top: 1px solid var(--border);
}
.ai-snip-item:last-child { border-bottom: none; }
.ai-snip-rank {
  font-size: 13px; color: var(--text-faint); font-variant-numeric: tabular-nums;
}
.ai-snip-body { min-width: 0; }
.ai-snip-name {
  display: block; font-size: 14px; font-weight: 650; color: var(--text-bright);
  text-decoration: none; word-break: break-word;
}
.ai-snip-name:hover { color: var(--accent); }
.ai-snip-name:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 3px; }
.ai-snip-desc {
  margin: 3px 0 0; font-size: 12.5px; line-height: 1.55; color: var(--text-secondary);
  display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical;
  overflow: hidden;
}
.ai-snip-stat {
  font-size: 12px; color: var(--accent); font-variant-numeric: tabular-nums;
  font-weight: 600; white-space: nowrap;
}

@media (max-width: 720px) {
  .ai-snip-item { grid-template-columns: 26px 1fr; }
  .ai-snip-stat { grid-column: 2; margin-top: 4px; }
}
</style>
