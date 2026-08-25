<template>
  <div class="gateway-page gateway-guide-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/gateway" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/gateway/docs</span>
        </router-link>
        <div class="nav-actions">
          <ThemeSwitcher />
          <span class="gateway-badge">MCP DOCUMENTATION</span>
          <a href="/HomePage" class="nav-link">返回博客</a>
        </div>
      </div>
    </header>

    <main class="guide-layout">
      <aside class="guide-sidebar terminal-panel">
        <div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">docs.index</span></div>
        <nav class="guide-nav" aria-label="文档目录">
          <a
            v-for="item in sections"
            :key="item.id"
            :href="'#' + item.id"
            :data-section-id="item.id"
            :class="{ active: activeSection === item.id }"
            @click="scrollToSection"
          >{{ item.label }}</a>
        </nav>
        <router-link to="/gateway" class="btn-secondary guide-back">返回 Gateway</router-link>
      </aside>

      <article class="terminal-panel guide-panel">
        <div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">cat docs/USAGE.md</span></div>
        <div class="guide-content markdown-body" v-html="renderedGuide"></div>
      </article>
    </main>

    <SiteFooter command="cat docs/USAGE.md" />
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { renderGuideMarkdown } from '../../utils/guideMarkdown.js'
import guideMarkdown from './gateway-usage.md?raw'
import './gateway-shared.css'

const sections = ref([])
const activeSection = ref('')
let scrollFrame

// DOMPurify strips id attributes, so anchor ids are re-derived from heading
// text (slugified) instead of by array index. The TOC therefore stays correct
// even when the markdown gains, loses, or reorders headings.
function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w一-龥-]/g, '')
    .replace(/-+/g, '-')
}

const renderedGuide = ref('')

function parseGuide() {
  const html = renderGuideMarkdown(guideMarkdown)
  if (typeof DOMParser === 'undefined') {
    renderedGuide.value = html
    sections.value = []
    return
  }
  const document = new DOMParser().parseFromString(html, 'text/html')
  const found = Array.from(document.querySelectorAll('h1, h2')).map((heading) => {
    const id = slugify(heading.textContent)
    heading.id = id
    return { id, label: heading.textContent.trim() }
  })
  sections.value = found
  activeSection.value = found[0]?.id ?? ''
  renderedGuide.value = document.body.innerHTML
}

function scrollToSection(event) {
  event.preventDefault()
  const id = event.currentTarget.dataset.sectionId
  const target = id ? document.getElementById(id) : null
  if (!target) return

  activeSection.value = id
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${encodeURIComponent(id)}`)
}

function sectionIdFromHash() {
  const hash = window.location.hash.slice(1)
  if (!hash) return ''
  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

function scrollToInitialHash() {
  const id = sectionIdFromHash()
  if (!id) return
  const target = document.getElementById(id)
  if (!target) return
  activeSection.value = id
  target.scrollIntoView({ behavior: 'auto', block: 'start' })
}

function updateActiveSection() {
  const headings = sections.value
    .map((section) => document.getElementById(section.id))
    .filter(Boolean)
  if (!headings.length) return

  const atPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8
  const current = atPageBottom
    ? headings.at(-1)
    : headings.filter((heading) => heading.getBoundingClientRect().top <= 120).at(-1)
  activeSection.value = (current ?? headings[0]).id
}

function handleScroll() {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = undefined
    updateActiveSection()
  })
}

onMounted(async () => {
  parseGuide()
  await nextTick()
  scrollToInitialHash()
  updateActiveSection()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
})
</script>

<style scoped>
.guide-layout { max-width: 1200px; margin: 0 auto; padding: 40px 24px 64px; display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 40px; position: relative; z-index: 1; }
.guide-sidebar { align-self: start; position: sticky; top: 80px; overflow: hidden; }
.guide-nav { display: grid; gap: 2px; padding: 8px; }
.guide-nav a { padding: 9px 10px; color: var(--text-dim); font-size: 11px; line-height: 1.45; text-decoration: none; border-left: 2px solid transparent; }
.guide-nav a:hover, .guide-nav a.active { color: var(--accent); background: var(--accent-a4); border-left-color: var(--accent); }
.guide-back { display: block; margin: 8px; text-align: center; text-decoration: none; }
.guide-panel { min-width: 0; overflow: hidden; }
.guide-content { padding: 28px 32px 42px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.guide-content :deep(h1), .guide-content :deep(h2), .guide-content :deep(h3) { color: var(--text-bright); line-height: 1.3; scroll-margin-top: 84px; }
.guide-content :deep(h1) { margin: 0 0 16px; font-family: 'JetBrains Mono', Consolas, monospace; font-size: clamp(24px, 4vw, 34px); }
.guide-content :deep(h2) { margin: 34px 0 12px; padding-top: 8px; border-top: 1px solid var(--border); font-family: 'JetBrains Mono', Consolas, monospace; font-size: 20px; }
.guide-content :deep(h3) { margin: 24px 0 10px; font-size: 15px; }
.guide-content :deep(p), .guide-content :deep(li) { color: var(--text-secondary); font-size: 14px; line-height: 1.8; }
.guide-content :deep(ul), .guide-content :deep(ol) { padding-left: 22px; }
.guide-content :deep(li) { margin: 5px 0; }
.guide-content :deep(table) { width: 100%; margin: 14px 0 20px; border-collapse: collapse; font-size: 13px; }
.guide-content :deep(th), .guide-content :deep(td) { padding: 10px 12px; text-align: left; border: 1px solid var(--border); }
.guide-content :deep(th) { color: var(--text-bright); background: var(--overlay-a15); }
.guide-content :deep(td) { color: var(--text-secondary); }
.guide-content :deep(code) { padding: 2px 5px; color: var(--accent); background: var(--bg-code); border-radius: 3px; font-family: 'JetBrains Mono', Consolas, monospace; font-size: .9em; overflow-wrap: anywhere; }
.guide-content :deep(pre) { margin: 14px 0 20px; padding: 16px; overflow-x: auto; color: var(--text-secondary); background: var(--bg-code); border: 1px solid var(--border); border-radius: 6px; }
.guide-content :deep(pre code) { padding: 0; color: inherit; background: transparent; }
.guide-content :deep(a) { color: var(--accent); }
.guide-content :deep(strong) { color: var(--text-bright); font-weight: 700; }
.guide-content :deep(blockquote) { margin: 16px 0; padding: 10px 14px; color: var(--text-dim); border-left: 3px solid var(--accent); background: var(--overlay-a4); }
.guide-content :deep(hr) { margin: 28px 0; border: 0; border-top: 1px solid var(--border); }
.guide-content :deep(img) { max-width: 100%; height: auto; }
@media (max-width: 800px) { .guide-layout { grid-template-columns: 1fr; gap: 20px; padding: 24px 16px 48px; }.guide-sidebar { position: static; }.guide-nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }.guide-content { padding: 22px 18px 32px; }.guide-content :deep(table) { display: block; overflow-x: auto; white-space: nowrap; } }
</style>
