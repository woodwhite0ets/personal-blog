// 代码高亮（Shiki，JS 正则引擎免 WASM，双主题支持明/暗）
// 设计：按需预热。只有真的可能出代码的页面（/post /notes /editor）才会加载
// 15 个语言包；公司页/榜单这类纯展示页直接跳过，不再为它等 ~110KB gz 的 JS。
// 渲染时同步取用（未就绪先输出纯文本），就绪后 highlighterReady 变化会让
// 调用方的 computed 重算一次（见 utils/markdown.js）。
import { ref } from 'vue'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

let hl = null
let enabled = false
let initPromise = null

// 就绪信号：markdown 渲染对它有依赖，晚到的高亮也能补上
export const highlighterReady = ref(false)

// 语言别名 → Shiki 语言名
const LANG_ALIAS = {
  js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'tsx',
  py: 'python', rb: 'ruby', sh: 'bash', shell: 'shell', zsh: 'shell',
  yml: 'yaml', html: 'html', htm: 'html', xml: 'html', vue: 'vue',
  md: 'markdown', txt: 'text', text: 'text', plaintext: 'text',
  dockerfile: 'dockerfile', docker: 'dockerfile', diff: 'diff', patch: 'diff',
}


// 幂等预热：重复调用只跑一次
export function ensureHighlighter() {
  if (!initPromise) initPromise = initHighlighter()
  return initPromise
}

async function initHighlighter() {
  try {
    const [{ default: js }, { default: ts }, { default: py }, { default: java }, { default: sql },
      { default: bash }, { default: shell }, { default: json }, { default: html }, { default: css },
      { default: md }, { default: yaml }, { default: dockerfile }, { default: diff }] = await Promise.all([
      import('shiki/langs/javascript.mjs'), import('shiki/langs/typescript.mjs'),
      import('shiki/langs/python.mjs'), import('shiki/langs/java.mjs'), import('shiki/langs/sql.mjs'),
      import('shiki/langs/bash.mjs'), import('shiki/langs/shell.mjs'), import('shiki/langs/json.mjs'),
      import('shiki/langs/html.mjs'), import('shiki/langs/css.mjs'), import('shiki/langs/markdown.mjs'),
      import('shiki/langs/yaml.mjs'), import('shiki/langs/dockerfile.mjs'), import('shiki/langs/diff.mjs'),
    ])
    const [{ default: dark }, { default: light }] = await Promise.all([
      import('shiki/themes/github-dark.mjs'), import('shiki/themes/github-light.mjs'),
    ])
    hl = await createHighlighterCore({
      themes: [dark, light],
      langs: [js, ts, py, java, sql, bash, shell, json, html, css, md, yaml, dockerfile, diff],
      engine: createJavaScriptRegexEngine(),
    })
    enabled = true
    highlighterReady.value = true
  } catch (e) {
    // 高亮失败不阻塞：回退为纯文本
    console.warn('[highlighter] init failed, fallback to plain:', e?.message || e)
    enabled = false
  }
}

/**
 * 把代码高亮成 HTML（双主题 CSS 变量，配合 style.css 的 [data-theme] 切换明暗）。
 * 返回 null 表示未就绪/失败，调用方应回退为纯文本。
 */
export function highlightToHtml(code, lang) {
  if (!enabled || !hl) return null
  const name = LANG_ALIAS[(lang || '').toLowerCase()] || (lang || '').toLowerCase()
  const useLang = name && hl.getLoadedLanguages().includes(name) ? name : 'text'
  try {
    return hl.codeToHtml(code, {
      lang: useLang,
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    })
  } catch {
    return null
  }
}

export function normalizeLang(lang) {
  const l = (lang || '').toLowerCase()
  return LANG_ALIAS[l] || l || 'text'
}
