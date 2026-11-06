// 站内路由切换时同步 SEO 元信息。
// 首屏 HTML 的 meta 由服务端注入（Server/src/injectSeo.js）；SPA 之后再转页，
// 浏览器不会重新加载文档，必须在这里手动改，否则 /work 会一直挂着首页的
// title 与 canonical（Google 渲染后会把 /work 归并到首页）。
import { findRouteMeta } from '../data/routeMeta.js'

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector)
  if (!el) {
    const match = selector.match(/^(\w+)\[([\w-]+)="([^"]+)"\]$/)
    if (!match) return
    el = document.createElement(match[1])
    el.setAttribute(match[2], match[3])
    document.head.appendChild(el)
  }
  el.setAttribute(attr, value)
}

export function applyRouteMeta(path) {
  const meta = findRouteMeta(path)
  if (!meta) return // 文章页等自行接管，不要覆盖

  document.title = meta.title
  setMeta('meta[name="description"]', 'content', meta.description)
  setMeta('meta[property="og:title"]', 'content', meta.title)
  setMeta('meta[property="og:description"]', 'content', meta.description)
  setMeta('meta[property="og:url"]', 'content', meta.canonical)
  setMeta('meta[name="twitter:title"]', 'content', meta.title)
  setMeta('meta[name="twitter:description"]', 'content', meta.description)
  setMeta('link[rel="canonical"]', 'href', meta.canonical)
}
