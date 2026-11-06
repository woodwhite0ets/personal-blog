/**
 * 路由级 SEO 元信息（单一真源）
 *
 * - 服务端：首屏 HTML 注入（Server/src/injectSeo.js 动态 import 本文件）
 * - 客户端：站内路由切换时同步 document.title / canonical / og（Client/src/utils/seo.js）
 *
 * canonical 一律写「首选域」绝对地址：公司页在 woodwhite.top，博客在 blog.woodwhite.top。
 * 两个域由 Caddy 分流：公司域只承载 / /work /stack /contact，其余 302 到博客域。
 */
export const SITE = {
  company: 'https://woodwhite.top',
  blog: 'https://blog.woodwhite.top',
}

// 表里没有的路径（文章页等）保持 index.html 的默认值，由页面自己接管
export const ROUTE_META = {
  '/': {
    title: '木白 woodwhite — 把 AI 接进你的业务，交付到稳定运行',
    description: '一个人做，从需求、数据、模型到上线后的巡检：AI 应用的后端与检索、本地推理与自动化、全栈实现。交付代码、部署脚本、监控与运行手册，可开票。',
    canonical: `${SITE.company}/`,
  },
  '/work': {
    title: '案例 — 木白 woodwhite',
    description: '已上线的项目：充电桩检定监管平台、自建 AI 工作站、AI 每日榜、知识库、本站，每条写清问题、做法与结果。',
    canonical: `${SITE.company}/work`,
  },
  '/stack': {
    title: '能力与基础设施 — 木白 woodwhite',
    description: '自托管的工作站：本地推理、pgvector 检索、自建 Git 与 CI、systemd 巡检，零入站端口，数据不出内网。',
    canonical: `${SITE.company}/stack`,
  },
  '/contact': {
    title: '联系 — 木白 woodwhite',
    description: '按项目或按月合作，签合同、可开票、按阶段验收。邮箱 1903784785@qq.com，微信 Woodwhite-0827。',
    canonical: `${SITE.company}/contact`,
  },
  '/blog': {
    title: '木白 woodwhite · 博客',
    description: '全栈开发与 AI 工程笔记：Vue 3、Node.js、本地推理、检索与部署。',
    canonical: `${SITE.blog}/blog`,
  },
  '/cocktails': {
    title: '调酒 — 木白 woodwhite',
    description: '家里那点工具能做的鸡尾酒：内格罗尼、得其利、古典、威士忌酸，写清材料比例、做法与变体。',
    canonical: `${SITE.blog}/cocktails`,
  },
  '/projects': {
    title: '案例 — 木白 woodwhite',
    description: '已上线的项目：充电桩检定监管平台、自建 AI 工作站、AI 每日榜、知识库、本站，每条写清问题、做法与结果。',
    canonical: `${SITE.blog}/projects`,
  },
  '/tools': {
    title: 'AI 工具库 — 木白 woodwhite',
    description: '按用途收录的 AI 工具，按分类、免费与否、是否需要自备 key 筛选，560 条持续更新。',
    canonical: `${SITE.blog}/tools`,
  },
  '/ai-daily': {
    title: 'AI 项目榜 — 每日 Star 增量榜',
    description: '每天从 GitHub 抓取 AI 相关项目，按 24 小时 Star 增量排名，中文介绍由本地模型生成。',
    canonical: `${SITE.blog}/ai-daily`,
  },
}

/** 路径 → 元信息（去掉多余的尾斜杠；表里没有的返回 null） */
export function findRouteMeta(path) {
  const key = String(path || '').replace(/\/+$/, '') || '/'
  return ROUTE_META[key] || null
}
