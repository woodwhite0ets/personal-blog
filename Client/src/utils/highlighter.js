// 代码高亮（Shiki，JS 正则引擎免 WASM，双主题支持明/暗）
// 设计：应用启动时预热一次；渲染时同步取用（未就绪则回退为纯文本转义）。
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

let hl = null
let enabled = false

// 语言别名 → Shiki 语言名
const LANG_ALIAS = {
  js: 'javascript', jsx: 'jsx', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'tsx',
  py: 'python', rb: 'ruby', sh: 'bash', shell: 'shell', zsh: 'shell',
  yml: 'yaml', html: 'html', htm: 'html', xml: 'html', vue: 'vue',
  md: 'markdown', txt: 'text', text: 'text', plaintext: 'text',
  dockerfile: 'dockerfile', docker: 'dockerfile', diff: 'diff', patch: 'diff',
}

export function isHighlighterReady() { return enabled }

export async function initHighlighter() {
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
