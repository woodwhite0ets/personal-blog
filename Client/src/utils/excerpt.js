// 摘要纯文本化：把 Markdown 源码剥成可读的一句话
// 用途：① 首页卡片渲染存量 excerpt（数据库里存的是原文截断）
//      ② 编辑器未填摘要时，从正文生成干净摘录

export function stripMarkdown(src, maxLen = 0) {
  if (!src) return ''
  let s = String(src)

  // 代码块 / 行内代码：整体去掉内容，保留可读性
  s = s.replace(/```[\s\S]*?```/g, ' ')
  s = s.replace(/~~~[\s\S]*?~~~/g, ' ')
  s = s.replace(/`[^`]*`/g, ' ')

  // 图片：直接丢弃（摘要里没意义）
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
  // 残缺图片语法（正文被截断后只剩 ![alt）
  s = s.replace(/!\[[^\]]*\]?/g, ' ')

  // 链接：保留文字
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // 引用式链接 [text][ref]
  s = s.replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')

  // HTML 标签与注释
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  s = s.replace(/<\/?[a-zA-Z][^>]*>/g, ' ')

  // 分隔线
  s = s.replace(/^[ \t]*([-*_])\1{2,}[ \t]*$/gm, ' ')

  // 标题井号
  s = s.replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')

  // 引用与列表标记
  s = s.replace(/^[ \t]{0,3}>[ \t]?/gm, '')
  s = s.replace(/^[ \t]{0,3}[-*+][ \t]+/gm, '')
  s = s.replace(/^[ \t]{0,3}\d+[.)][ \t]+/gm, '')

  // 强调：***text*** / **text** / *text* / ___ / __ / _
  s = s.replace(/(\*{1,3})([^*]+)\1/g, '$2')
  s = s.replace(/(_{1,3})([^_]+)\1/g, '$2')
  s = s.replace(/~~([^~]+)~~/g, '$1')

  // 表格分隔行
  s = s.replace(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)*\|?[ \t]*$/gm, ' ')
  // 表格竖线
  s = s.replace(/[ \t]*\|[ \t]*/g, ' ')

  // 转义反斜杠
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1')

  // 残余孤立标记（截断产生的残缺 ## / ** 等），仅在被空白包围时清理
  s = s.replace(/(^|\s)[#*_~`]+(?=\s|$)/g, '$1')

  // 空白归一
  s = s.replace(/\s+/g, ' ').trim()

  if (maxLen > 0 && s.length > maxLen) {
    // 在词/字边界截断，中文直接切
    s = s.slice(0, maxLen).replace(/[，,、；;：:\s]+$/, '') + '…'
  }
  return s
}

export default stripMarkdown
