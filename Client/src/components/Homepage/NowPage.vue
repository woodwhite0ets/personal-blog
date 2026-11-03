<template>
  <div class="now-page">
    <SiteNav />

    <main class="now-main">
      <header class="now-head">
        <p class="now-kicker">现在</p>
        <h1 class="now-title">最近在忙什么</h1>
        <p class="now-lead">
          这页写「此刻」的状态，不是归档。过期的内容会被替换，历史留在文章和归档里。
        </p>
        <p class="now-updated">最后手动更新：{{ handUpdated }}</p>
      </header>

      <section class="now-sec">
        <h2 class="now-sec-title">在推的事</h2>
        <ul class="now-list">
          <li v-for="item in working" :key="item.what">
            <router-link v-if="item.to" :to="item.to" class="now-link">{{ item.what }}</router-link>
            <span v-else>{{ item.what }}</span>
            <span class="now-detail">{{ item.detail }}</span>
          </li>
        </ul>
      </section>

      <section class="now-sec">
        <h2 class="now-sec-title">最近在写</h2>
        <p v-if="recentLoading" class="now-dim">加载中…</p>
        <ul v-else-if="recent.length" class="now-list">
          <li v-for="p in recent" :key="p.slug">
            <router-link :to="`/post/${p.slug || p.id}`" class="now-link">{{ p.title }}</router-link>
            <time class="now-detail">{{ p.date }}</time>
          </li>
        </ul>
        <p v-else class="now-dim">最近没有新文章。</p>
      </section>

      <section class="now-sec">
        <h2 class="now-sec-title">机器上的状态</h2>
        <dl class="now-stats">
          <div>
            <dt>AI 项目榜</dt>
            <dd>
              <template v-if="aiDate">最新一期 {{ aiDate }}</template>
              <template v-else>还没拉到</template>
              <router-link to="/ai-daily" class="now-inline-link">看榜单</router-link>
            </dd>
          </div>
          <div>
            <dt>笔记</dt>
            <dd>
              <template v-if="notesTotal">{{ notesTotal }} 条结论</template>
              <template v-else>—</template>
              <router-link to="/notes" class="now-inline-link">看索引</router-link>
            </dd>
          </div>
          <div>
            <dt>文章</dt>
            <dd>{{ postTotal || '—' }} 篇</dd>
          </div>
          <div>
            <dt>工作站</dt>
            <dd>22 个项目 · 6 个定时器 · 零入站端口</dd>
          </div>
        </dl>
      </section>

      <section class="now-sec">
        <h2 class="now-sec-title">这页的规则</h2>
        <p class="now-note">
          只写正在做、能验证的事。做完了就从这页删掉，换成结果放到项目页或文章里。
        </p>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'

// 手写部分：这一页的「现在」由人工维护
const handUpdated = '2026-10-24'
const working = [
  { what: '给博客补前端能力', detail: '语义相关、笔记公开页、项目页、搜索加权', to: '/projects/blog' },
  { what: '把知识库改造成 AI 好用的形态', detail: '主题全景、统一入口、引用体检', to: '/projects/notes' },
  { what: '整理简历与实习材料', detail: '按岗位拆七个方向，公开内容留在简历库' },
]

const recent = ref([])
const recentLoading = ref(true)
const aiDate = ref('')
const notesTotal = ref(0)
const postTotal = ref(0)

onMounted(async () => {
  const safe = async (fn, fallback) => { try { return await fn() } catch { return fallback } }

  const posts = await safe(async () => {
    const res = await fetch('/api/posts?page=1&size=3&status=published')
    if (!res.ok) throw new Error('posts')
    return res.json()
  }, null)
  if (posts) {
    recent.value = posts.posts || []
    postTotal.value = posts.total || recent.value.length
  }
  recentLoading.value = false

  const ai = await safe(async () => {
    const res = await fetch('/api/ai-daily/dates?limit=1')
    if (!res.ok) throw new Error('ai')
    return res.json()
  }, null)
  if (ai?.dates?.length) aiDate.value = ai.dates[0].date

  const notes = await safe(async () => {
    const res = await fetch('/api/notes')
    if (!res.ok) throw new Error('notes')
    return res.json()
  }, null)
  if (notes) notesTotal.value = notes.total || 0
})
</script>

<style scoped>
.now-page { min-height: 100vh; background: var(--bg); color: var(--text); }
.now-main { max-width: var(--page-w); margin: 0 auto; padding: 64px var(--page-pad) 104px; }

.now-head { padding-bottom: 22px; }
.now-kicker { margin: 0 0 8px; font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .08em; color: var(--text-faint); }
.now-title {
  margin: 0;
  letter-spacing: -0.025em; color: var(--text-bright); text-wrap: balance;
}
.now-lead { margin: 12px 0 0; font-size: 0.875rem; line-height: 1.75; color: var(--text-secondary); max-width: 64ch; }
.now-updated { margin: 10px 0 0; font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: .04em; color: var(--text-faint); font-variant-numeric: tabular-nums; }

.now-sec { margin-top: 30px; }
.now-sec-title {
  margin: 0 0 6px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600;
  letter-spacing: .1em; color: var(--text-secondary); padding-bottom: 10px;
}
.now-list { list-style: none; margin: 0; padding: 0; }
.now-list li {
  display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
  padding: 11px 2px; font-size: 0.9375rem; color: var(--text);
  border-bottom: 1px dotted var(--rule-dot-ink);
}
.now-link { color: var(--text-bright); text-decoration: none; border-bottom: 1px solid var(--border-strong); }
.now-link:hover { color: var(--text-bright); border-color: var(--text-bright); }
.now-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
.now-detail { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-faint); font-variant-numeric: tabular-nums; }

.now-stats { margin: 0; display: grid; gap: 10px; }
.now-stats > div { display: grid; grid-template-columns: 96px 1fr; gap: 12px; align-items: baseline; }
.now-stats dt { font-size: 0.7812rem; color: var(--text-dim); }
.now-stats dd { margin: 0; font-size: 0.8438rem; color: var(--text-secondary); }
.now-inline-link {
  margin-left: 10px; font-size: 0.75rem; color: var(--accent);
  text-decoration: none; border-bottom: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
}
.now-dim { font-size: 0.8125rem; color: var(--text-dim); }
.now-note { margin: 0; font-size: 0.8125rem; line-height: 1.75; color: var(--text-secondary); max-width: 68ch; }

@media (max-width: 720px) {
  .now-main { padding: 40px 20px 72px; }
  .now-stats > div { grid-template-columns: 80px 1fr; }
}
</style>
