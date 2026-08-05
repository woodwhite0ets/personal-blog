// ====== Markdown 渲染（含代码语法高亮） ======
// 集中配置，供文章详情、编辑器预览等处复用
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

// 仅注册常用语言，减小打包体积（避免引入全部 ~190 种语言）
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import shell from 'highlight.js/lib/languages/shell'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import markdown from 'highlight.js/lib/languages/markdown'
import yaml from 'highlight.js/lib/languages/yaml'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import diff from 'highlight.js/lib/languages/diff'
import plaintext from 'highlight.js/lib/languages/plaintext'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('java', java)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)   // HTML 用 xml 语言高亮
hljs.registerLanguage('css', css)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('diff', diff)
hljs.registerLanguage('plaintext', plaintext)

// 配置 marked 使用 highlight.js
marked.use(markedHighlight({
  langPrefix: 'hljs language-',
  highlight(code, lang) {
    const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    try {
      return hljs.highlight(code, { language }).value
    } catch {
      return hljs.highlightAuto(code).value
    }
  },
}))

// 渲染 markdown → 已消毒的 HTML（XSS 安全）
// DOMPurify 配置：禁止 style/id/name 属性，只允许 http(s)/ftp/相对路径
export function renderMarkdown(content) {
  if (!content || typeof content !== 'string') return ''
  const raw = marked(content)
  return DOMPurify.sanitize(raw, {
    FORBID_ATTR: ['style', 'id', 'name'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp):\/\/|\/)/i,
  })
}
