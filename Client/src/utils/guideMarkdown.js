import { marked } from 'marked'
import DOMPurify from 'dompurify'

// The usage guide does not need syntax highlighting. Keeping it separate from
// the full article renderer avoids loading highlight.js on the documentation route.
// 剥离 YAML frontmatter，避免网关返回的原始文档元数据被渲染成正文
function stripFrontmatter(src) {
  if (typeof src !== 'string') return src
  return src.replace(/^\uFEFF/, '').replace(/^---\s*\n[\s\S]*?\n(?:---|\.\.\.)\s*\n?/, '')
}

export function renderGuideMarkdown(content) {
  if (!content || typeof content !== 'string') return ''
  return DOMPurify.sanitize(marked.parse(stripFrontmatter(content)), {
    FORBID_ATTR: ['style', 'id', 'name'],
    // DOMPurify's default SAFE_URL_PATTERN allows mailto:, #anchors, relative
    // and protocol-relative links while still blocking javascript:/data:/vbscript:
    // (id attributes are re-added from heading text by GatewayGuide.vue's
    // slugify so the TOC keeps working even though DOMPurify strips them).
  })
}
