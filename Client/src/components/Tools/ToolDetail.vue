<template>
  <div class="td-page">
    <SiteNav />

    <main class="td-main">
      <p class="td-back"><RouterLink to="/tools">← 工具库</RouterLink></p>

      <p v-if="loading" class="td-status" role="status" aria-live="polite">加载中…</p>
      <div v-else-if="error" class="td-status">
        <p>{{ error }}</p>
        <RouterLink class="td-back-link" to="/tools">回工具库</RouterLink>
      </div>

      <template v-else-if="tool">
        <header class="td-head">
          <h1 class="td-title">{{ tool.name }}</h1>
          <p class="td-tagline">{{ tool.tagline_zh || tool.desc_en }}</p>
          <p v-if="tool.note_zh" class="td-note">{{ tool.note_zh }}</p>
        </header>

        <dl class="td-facts">
          <div><dt>用途</dt><dd>{{ tool.category_label }}</dd></div>
          <div><dt>形态</dt><dd>{{ formLabel(tool.form) }}</dd></div>
          <div><dt>价格</dt><dd>{{ pricingLabel(tool.pricing) }}</dd></div>
          <div><dt>自备 key</dt><dd>{{ tool.needs_key ? '需要' : '不需要' }}</dd></div>
          <div><dt>中文界面</dt><dd>{{ tool.zh_ui ? '有' : '无' }}</dd></div>
          <div><dt>星数</dt><dd>{{ tool.stars.toLocaleString() }}<span v-if="tool.star_gain_7d > 0" class="td-gain"> +{{ tool.star_gain_7d }} / 7 天</span></dd></div>
        </dl>

        <p v-if="tool.tags.length" class="td-tags">
          <span v-for="t in tool.tags" :key="t" class="td-tag">#{{ t }}</span>
        </p>

        <p class="td-links">
          <a :href="tool.url" target="_blank" rel="noopener">打开主页</a>
          <a v-if="tool.repo" :href="`https://github.com/${tool.repo}`" target="_blank" rel="noopener">源码仓库</a>
        </p>

        <section v-if="tool.on_board.length" class="td-board">
          <h2>上过每日 AI 榜</h2>
          <ul>
            <li v-for="b in tool.on_board" :key="b.date">{{ b.date }} · 第 {{ b.rank }} 位</li>
          </ul>
        </section>

        <p v-if="tool.desc_en" class="td-desc-en">{{ tool.desc_en }}</p>
      </template>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'

const route = useRoute()
const tool = ref(null)
const loading = ref(true)
const error = ref('')

const FORMS = { web: '网页', desktop: '桌面', cli: '命令行', library: '开发库', model: '模型', plugin: '插件' }
const PRICING = { freemium: '免费额度', paid: '付费', api: '只卖 API', free: '免费' }
const formLabel = (f) => FORMS[f] || f
const pricingLabel = (p) => PRICING[p] || p

async function load() {
  loading.value = true
  error.value = ''
  tool.value = null
  try {
    const res = await fetch(`/api/ai-tools/${encodeURIComponent(route.params.slug)}`)
    if (res.status === 404) {
      error.value = '没有这个工具，可能已下架或链接写错了。'
      return
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    tool.value = await res.json()
  } catch (err) {
    error.value = '加载失败，刷新一下再试。'
    console.error('工具详情加载失败', err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.slug, load)
</script>

<style scoped>
.td-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.td-main { max-width: 820px; margin: 0 auto; padding: 64px var(--page-pad) 104px; }

.td-back { margin: 0 0 22px; font-size: 0.8125rem; }
.td-back a { color: var(--text-dim); text-decoration: none; }
.td-back a:hover { color: var(--accent); }
.td-back a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.td-status { font-size: 0.875rem; color: var(--text-dim); line-height: 1.8; }
.td-back-link { color: var(--accent); }

.td-head { padding-bottom: 18px; border-bottom: 1px solid var(--border); }
.td-title { margin: 0 0 10px; letter-spacing: -.01em; text-wrap: balance; }
.td-tagline { margin: 0; font-size: 1rem; line-height: 1.7; color: var(--text-bright); max-width: 60ch; }
.td-note {
  margin: 14px 0 0; padding-left: 12px; border-left: 2px solid var(--border-strong);
  font-size: 0.875rem; line-height: 1.7; color: var(--text-dim);
}

.td-facts {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px 24px;
  margin: 22px 0 0;
}
.td-facts > div { display: flex; flex-direction: column; gap: 3px; }
.td-facts dt { font-size: 0.75rem; color: var(--text-faint); }
.td-facts dd { margin: 0; font-size: 0.875rem; font-variant-numeric: tabular-nums; }
.td-gain { color: var(--ok); font-size: 0.75rem; }

.td-tags { display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0 0; font-size: 0.8125rem; color: var(--text-dim); }
.td-tag::first-letter { color: var(--text-faint); }

.td-links { display: flex; gap: 18px; margin: 22px 0 0; font-size: 0.875rem; }
.td-links a { color: var(--accent); text-decoration: none; }
.td-links a:hover { color: var(--accent-hover); }
.td-links a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.td-board { margin-top: 34px; padding-top: 18px; border-top: 1px solid var(--border); }
.td-board h2 { margin: 0 0 10px; font-size: 0.8125rem; font-weight: 500; color: var(--text-dim); }
.td-board ul { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 0.8125rem; color: var(--text-secondary); font-variant-numeric: tabular-nums; }

.td-desc-en { margin: 30px 0 0; font-size: 0.8125rem; line-height: 1.7; color: var(--text-faint); overflow-wrap: anywhere; }

@media (max-width: 640px) {
  .td-main { padding: 56px 16px 88px; }
}
</style>
