// ====== Markdown 渲染（代码块用 Shiki 高亮 + 复制按钮） ======
// 集中配置，供文章详情、编辑器预览、网关控制台等处复用。
// 流程：marked 出 HTML → DOMPurify 消毒 → 对已消毒的代码块做 Shiki 高亮（高亮产物为可信 HTML，避开消毒剥离 style）
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { highlightToHtml, normalizeLang } from './highlighter.js'

// 正文图片延迟加载（loading=lazy，减少首屏流量）
marked.use({
  renderer: {
    image({ href, title, text }) {
      const esc = (v) => String(v ?? '').replace(/"/g, '&quot;')
      const t = title ? ` title="${esc(title)}"` : ''
      return `<img src="${esc(href)}" alt="${esc(text)}" loading="lazy" decoding="async"${t}>`
    },
  },
})

function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 代码块外层 chrome：语言标签 + 复制按钮（复制按钮由全局事件委托处理，符合 CSP 无内联脚本）
function codeBlockHtml(preInner, langLabel) {
  return `<div class="code-block"><div class="code-head"><span class="code-lang">${escapeHtml(langLabel)}</span>` +
    `<button class="code-copy" type="button" aria-label="复制代码">复制</button></div>${preInner}</div>`
}

// 把已消毒 HTML 中的 <pre><code> 替换为高亮后的代码块
function enhanceCodeBlocks(html) {
  return html.replace(
    /<pre><code(?: class="language-([\w+#.-]+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_m, lang, codeHtml) => {
      const code = decodeEntities(codeHtml)
      const label = normalizeLang(lang)
      const highlighted = highlightToHtml(code, lang)
      const pre = highlighted || `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
      return codeBlockHtml(pre, label)
    }
  )
}

// 剥离 YAML frontmatter（知识库文档原始内容避免元数据被渲染成正文）
function stripFrontmatter(src) {
  if (typeof src !== 'string') return src
  return src.replace(/^\uFEFF/, '').replace(/^---\s*\n[\s\S]*?\n(?:---|\.\.\.)\s*\n?/, '')
}

// 渲染 markdown → 已消毒 HTML（XSS 安全）
// DOMPurify 配置：禁止 style/id/name 属性，只允许 http(s)/ftp/相对路径
export function renderMarkdown(content, options = {}) {
  if (!content || typeof content !== 'string') return ''
  const raw = marked(stripFrontmatter(content))
  const clean = DOMPurify.sanitize(raw, {
    FORBID_ATTR: ['style', 'id', 'name'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp):\/\/|\/)/i,
  })
  // 已消毒 HTML，先给不带 loading 的 img 补懒加载，再增强代码块（后者产物可信）
  let out = clean.replace(/<img(?![^>]*\bloading=)/gi, '<img loading="lazy"')
  // 文章页：正文内 h1 降级为 h2，保证整页只有一个 H1（语义/SEO）
  if (options.demoteH1) out = out.replace(/<(\/?)h1(\s[^>]*)?>/gi, '<$1h2$2>')
  return enhanceCodeBlocks(out)
}
