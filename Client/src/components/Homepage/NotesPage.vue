<template>
  <div class="notes-page">
    <SiteNav />

    <main v-if="detail" class="notes-main notes-detail">
      <router-link class="detail-back" :to="{ path: '/notes' }">← 回到笔记索引</router-link>
      <h1 class="detail-title">{{ detail.title }}</h1>
      <p class="detail-meta">
        <span class="note-project">{{ detail.project }}</span>
        <time>{{ detail.updated }}</time>
        <span v-if="detail.tags?.length" class="detail-tags">{{ detail.tags.join(' · ') }}</span>
      </p>
      <div class="detail-body markdown-body" v-html="detailHtml"></div>
      <p class="detail-note">这条笔记来自我的本地知识库，正文里的内网地址、绝对路径和凭据在生成时已替换成占位符。</p>
    </main>

    <main v-else class="notes-main">
      <header class="notes-head">
        <p class="notes-kicker">知识库 · 公开索引</p>
        <h1 class="notes-title">笔记</h1>
        <p class="notes-lead">
          写项目时留下的结论、坑和判断，一共 {{ total }} 条。这里只放标题和一句话摘要，
          正文里有内网地址、路径和命令，留在自己的机器上。
        </p>
        <p class="notes-meta">
          <span v-if="generatedAt">更新于 {{ generatedAt.slice(0, 10) }}</span>
          <span v-if="loading">加载中…</span>
        </p>
      </header>

      <div class="notes-tools">
        <div class="notes-filters" role="group" aria-label="按项目筛选">
          <button
            v-for="p in ['全部'].concat(projects)" :key="p" type="button"
            class="filter-btn" :class="{ active: activeProject === (p === '全部' ? '' : p) }"
            @click="activeProject = (p === '全部' ? '' : p)"
          >{{ p }}</button>
        </div>
        <label class="notes-search">
          <span class="sr-only">在标题和摘要里搜索</span>
          <input v-model="keyword" type="search" placeholder="搜标题或摘要" />
        </label>
      </div>

      <div v-if="!loading && filtered.length === 0" class="notes-empty">
        <p v-if="keyword || activeProject">这个筛选下没有笔记，换个关键词或清空筛选试试。</p>
        <template v-else>
          <p>我这里暂时没有公开的笔记。</p>
          <p class="notes-empty-sub">写项目时留下的结论还在本机知识库里，公开的只有文章。</p>
          <router-link class="notes-empty-cta" to="/forum">去看文章</router-link>
        </template>
      </div>

      <ul class="notes-list">
        <li v-for="n in filtered" :key="n.path" class="note-item">
          <div class="note-line">
            <router-link class="note-title" :to="{ path: '/notes', query: { p: n.path } }">{{ n.title }}</router-link>
            <span class="note-project">{{ n.project }}</span>
            <time class="note-date">{{ n.updated }}</time>
          </div>
          <p v-if="n.summary" class="note-summary">{{ n.summary }}</p>
          <p v-if="n.tags.length" class="note-tags">{{ n.tags.join(' · ') }}</p>
        </li>
      </ul>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { renderMarkdown } from '../../utils/markdown.js'

const route = useRoute()
const detail = ref(null)
const detailHtml = computed(() => (detail.value ? renderMarkdown(detail.value.body || '', { demoteH1: true }) : ''))

async function loadDetail(p) {
  if (!p) { detail.value = null; return }
  try {
    const res = await fetch(`/api/notes/detail?path=${encodeURIComponent(p)}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    detail.value = await res.json()
    window.scrollTo({ top: 0 })
  } catch (err) {
    console.error('笔记详情加载失败:', err)
    detail.value = null
  }
}

watch(() => route.query.p, (v) => loadDetail(String(v || '')))
onMounted(() => loadDetail(String(route.query.p || '')))

const notes = ref([])
const projects = ref([])
const total = ref(0)
const generatedAt = ref('')
const loading = ref(true)
const activeProject = ref('')
const keyword = ref('')

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return notes.value.filter((n) => {
    if (activeProject.value && n.project !== activeProject.value) return false
    if (!kw) return true
    return `${n.title} ${n.summary} ${(n.tags || []).join(' ')}`.toLowerCase().includes(kw)
  })
})

onMounted(async () => {
  try {
    const res = await fetch('/api/notes')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    notes.value = data.notes || []
    projects.value = data.projects || []
    total.value = data.total ?? notes.value.length
    generatedAt.value = data.generatedAt || ''
  } catch (err) {
    console.error('笔记索引加载失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.notes-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.notes-main { max-width: var(--page-w); margin: 0 auto; padding: 64px var(--page-pad) 104px; }

.notes-head { padding-bottom: 24px; border-bottom: 1px solid var(--border); }
.notes-kicker { margin: 0 0 8px; font-size: 0.75rem; letter-spacing: .08em; color: var(--text-dim); }
.notes-title {
  margin: 0;
  letter-spacing: -0.025em; color: var(--text-bright); text-wrap: balance;
}
.notes-lead { margin: 14px 0 0; max-width: 66ch; font-size: 0.875rem; line-height: 1.75; color: var(--text-secondary); text-wrap: pretty; }
.notes-meta { margin: 10px 0 0; font-size: 0.7812rem; color: var(--text-faint); font-variant-numeric: tabular-nums; }

.notes-tools {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  margin: 22px 0 6px; flex-wrap: wrap;
}
.notes-filters { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-btn {
  border: 1px solid var(--border-strong); background: transparent; color: var(--text-dim);
  font-size: 0.7812rem; padding: 5px 11px; border-radius: 999px; cursor: pointer;
}
.filter-btn:hover { color: var(--text); border-color: var(--text-dim); }
.filter-btn.active { color: var(--accent); border-color: var(--accent); }
.filter-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.notes-search input {
  width: 200px; padding: 7px 11px; border-radius: 8px;
  border: 1px solid var(--border-strong); background: var(--bg-elevated);
  color: var(--text); font-size: 0.8125rem;
}
.notes-search input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.notes-list { list-style: none; margin: 10px 0 0; padding: 0; }
.note-item { padding: 18px 2px; border-top: 1px solid var(--border); }
.note-line { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.note-title { font-size: 0.9375rem; font-weight: 650; color: var(--text-bright); }
.note-project {
  font-size: 0.6875rem; color: var(--text-dim); padding: 1px 7px;
  border: 1px solid var(--border); border-radius: 999px;
}
.note-date { margin-left: auto; font-size: 0.75rem; color: var(--text-faint); font-variant-numeric: tabular-nums; }
.note-summary { margin: 6px 0 0; font-size: 0.8125rem; line-height: 1.7; color: var(--text-secondary); max-width: 76ch; }
.note-tags { margin: 6px 0 0; font-size: 0.6875rem; color: var(--text-faint); letter-spacing: .02em; }
.notes-empty { padding: 36px 2px; font-size: 0.875rem; color: var(--text-dim); line-height: 1.8; }
.notes-empty p { margin: 0 0 6px; }
.notes-empty-sub { color: var(--text-faint); font-size: 0.8125rem; }
.notes-empty-cta {
  display: inline-block; margin-top: 14px; font-size: 0.8125rem;
  color: var(--accent); text-decoration: none;
  border-bottom: 1px solid transparent;
}
.notes-empty-cta:hover { border-bottom-color: var(--accent); }
.notes-empty-cta:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.note-title { text-decoration: none; }
.note-title:hover { color: var(--accent); }
.note-title:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 3px; }

/* 详情视图 */
.notes-detail { max-width: 820px; }
.detail-back {
  display: inline-block; margin-bottom: 22px; font-size: 0.8125rem; color: var(--text-dim);
  text-decoration: none; border-bottom: 1px solid var(--border-strong);
}
.detail-back:hover { color: var(--accent); border-color: var(--accent); }
.detail-title {
  margin: 0; font-size: clamp(1.625rem, 3.4vw, 2.375rem); font-weight: 700;
  letter-spacing: -0.02em; color: var(--text-bright); text-wrap: balance;
}
.detail-meta {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  margin: 12px 0 26px; font-size: 0.7812rem; color: var(--text-faint);
  padding-bottom: 16px; border-bottom: 1px solid var(--border);
}
.detail-tags { letter-spacing: .02em; }
.detail-body { font-size: 0.9375rem; line-height: 1.8; color: var(--text); }
.detail-body :deep(h1), .detail-body :deep(h2) {
  margin: 28px 0 12px; font-size: 1.25rem; color: var(--text-bright);
}
.detail-body :deep(h3) { margin: 22px 0 10px; font-size: 1rem; color: var(--text-bright); }
.detail-body :deep(pre) {
  background: var(--bg-code); border: 1px solid var(--border); border-radius: 8px;
  padding: 14px 16px; overflow-x: auto; font-size: 0.7812rem; line-height: 1.6;
}
.detail-body :deep(code) { font-family: ui-monospace, monospace; font-size: .92em; }
.detail-body :deep(p code) { background: var(--bg-elevated); padding: 1px 5px; border-radius: 3px; }
.detail-body :deep(table) { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 0.8125rem; }
.detail-body :deep(th), .detail-body :deep(td) { border: 1px solid var(--border); padding: 7px 10px; text-align: left; }
.detail-body :deep(blockquote) {
  margin: 14px 0; padding: 8px 16px; border-left: 3px solid var(--border-strong);
  color: var(--text-secondary);
}
.detail-note {
  margin: 36px 0 0; padding-top: 16px; border-top: 1px solid var(--border);
  font-size: 0.7812rem; color: var(--text-faint);
}
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

@media (max-width: 720px) {
  .notes-main { padding: 40px 20px 72px; }
  .notes-search input { width: 100%; }
  .notes-search { width: 100%; }
  .note-date { margin-left: 0; }
}
</style>
