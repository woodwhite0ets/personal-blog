<template>
  <div class="kb-page">
    <SiteNav />
    <main class="kb-main">
      <aside class="kb-sidebar">
        <div class="kb-sidebar-head">
          <span class="kb-sidebar-title">知识库</span>
        </div>

        <div v-if="loading" class="kb-state">加载中…</div>

        <div v-else-if="!authed" class="kb-login-hint">
          <p class="kb-login-text">登录后即可浏览知识库文档。</p>
          <router-link to="/login?redirect=/kb" class="kb-login-btn">登录 / 注册</router-link>
        </div>

        <template v-else>
          <div class="kb-projects">
            <button
              v-for="p in projects"
              :key="p"
              class="kb-project"
              :class="{ active: p === projectId }"
              @click="openProject(p)"
            >{{ p }}</button>
          </div>

          <div v-if="projectId" class="kb-docs">
            <button
              v-for="d in documents"
              :key="d.path"
              class="kb-doc"
              :class="{ active: d.path === documentPath }"
              @click="openDocument(d.path)"
            >{{ docTitle(d.path) }}</button>
          </div>
        </template>
      </aside>

      <section class="kb-content">
        <div v-if="error" class="kb-error">{{ error }}</div>
        <article v-else-if="document" class="kb-article markdown-body" v-html="rendered"></article>
        <div v-else-if="authed && projectId" class="kb-empty"><p>选择左侧文档查看内容。</p></div>
        <div v-else-if="!authed" class="kb-empty"><p>知识库面向已登录用户开放。</p></div>
        <div v-else class="kb-empty"><p>暂无文档。</p></div>
      </section>
    </main>
    <SiteFooter command="ls -laR ./knowledge/" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SiteNav from '../common/SiteNav.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { renderMarkdown } from '../../utils/markdown.js'
import { gatewayApi, ensureGatewaySession } from '../../utils/http.js'

const authed = ref(false)
const loading = ref(true)
const projects = ref([])
const projectId = ref('')
const documents = ref([])
const documentPath = ref('')
const document = ref(null)
const error = ref('')

const rendered = computed(() => (document.value ? renderMarkdown(document.value.content) : ''))

function docTitle(path) {
  const name = String(path || '').split('/').pop()
  return name.replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim() || path
}

async function openProject(id) {
  projectId.value = id
  documentPath.value = ''
  document.value = null
  documents.value = []
  error.value = ''
  try {
    documents.value = await gatewayApi(`/api/projects/${encodeURIComponent(id)}/documents`)
  } catch (e) { error.value = e.message }
}

async function openDocument(path) {
  documentPath.value = path
  document.value = null
  error.value = ''
  try {
    document.value = await gatewayApi(`/api/projects/${encodeURIComponent(projectId.value)}/documents/${encodeURIComponent(path)}`)
  } catch (e) { error.value = e.message }
}

onMounted(async () => {
  loading.value = true
  authed.value = await ensureGatewaySession()
  if (authed.value) {
    try {
      projects.value = await gatewayApi('/api/projects')
      if (projects.value.length) await openProject(projects.value[0])
    } catch (e) { error.value = e.message }
  }
  loading.value = false
})
</script>

<style scoped>
.kb-page { min-height: 100vh; display: flex; flex-direction: column; }
.kb-main {
  flex: 1; width: 100%; max-width: 1180px; margin: 0 auto; padding: 28px 24px;
  display: grid; grid-template-columns: 272px 1fr; gap: 24px; align-items: start;
}
.kb-sidebar {
  position: sticky; top: 76px; background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 12px; padding: 16px; max-height: calc(100vh - 110px);
  overflow-y: auto;
}
.kb-sidebar-head { margin-bottom: 12px; }
.kb-sidebar-title { font-size: 14px; font-weight: 700; color: var(--accent); letter-spacing: 1px; }
.kb-state, .kb-login-hint { padding: 8px 4px; font-size: 13px; color: var(--text-dim); }
.kb-login-text { margin-bottom: 12px; }
.kb-login-btn {
  display: inline-block; padding: 8px 14px; font-size: 12px; font-weight: 600;
  color: var(--accent); border: 1px solid var(--accent); border-radius: 8px; text-decoration: none;
}
.kb-projects { display: flex; flex-direction: column; gap: 4px; }
.kb-project {
  text-align: left; padding: 9px 12px; font-size: 13px; font-weight: 600; color: var(--text-dim);
  background: transparent; border: 1px solid transparent; border-radius: 8px; cursor: pointer;
}
.kb-project:hover { color: var(--text); background: var(--surface-2, rgba(127,127,127,.06)); }
.kb-project.active { color: var(--accent); background: var(--surface-2, rgba(127,127,127,.08)); border-color: var(--border); }
.kb-docs { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; }
.kb-doc {
  text-align: left; padding: 7px 10px 7px 18px; font-size: 12.5px; color: var(--text-dim);
  background: transparent; border: none; border-radius: 6px; cursor: pointer; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.kb-doc:hover { color: var(--text); }
.kb-doc.active { color: var(--accent); font-weight: 600; }
.kb-content {
  background: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 12px; padding: 28px 34px; min-height: 60vh;
}
.kb-article { max-width: 760px; }.kb-error { color: #e5484d; font-size: 13px; padding: 16px; }
.kb-empty { color: var(--text-dim); font-size: 14px; padding: 40px 0; text-align: center; }
@media (max-width: 860px) {
  .kb-main { grid-template-columns: 1fr; }
  .kb-sidebar { position: static; max-height: none; }
}
</style>
