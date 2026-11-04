/**
 * 项目档案（前端静态数据）
 * 只写做过的、能指出证据的东西：时间、数字、踩过的坑。
 * 详细过程放文章链接，这里负责「这是什么 + 为什么这么做」。
 */
export const projects = [
  {
    slug: 'charging-map',
    result: '区域筛选从切一次卡两秒降到毫秒级；10 万+ 条数据在线',
    name: '乐清市充电桩分布图',
    subtitle: '从单体 SQLite 到 Docker + PostGIS 的检定监管系统',
    status: '已交付',
    period: '2026.08',
    stack: ['Vue 3', 'Node.js', 'PostgreSQL 16 + PostGIS', '高德地图 API', 'Docker Compose'],
    summary: '面向乐清 25 个乡镇街道的充电桩数据平台，地图浏览、多维筛选、选点新增与检定状态追踪，数据量 10 万+ 条。',
    links: [
      { label: '架构升级实录', to: '/post/乐清市充电桩分布图-从单体-sqlite-到-docker-postgis-的架构升级实践-mscizusr' },
      { label: '早期版本说明', to: '/post/乐清市充电桩分布图-检定监管平台-mschs9sh' },
    ],
    sections: [
      {
        title: '起点是一个跑不动的单体',
        body: '最早的版本用 sql.js 把 SQLite 塞在进程里，地图上的区域筛选靠前端把全量数据拉下来再过滤。数据涨到几万条时，切一次乡镇要卡两秒。问题不在前端，在"数据在哪算"。',
      },
      {
        title: '把计算挪回数据库',
        body: '迁到 PostgreSQL 16 + PostGIS 3.4 后，区域查询改由 ST_MakeEnvelope 空间索引承载，地图范围内的点由数据库直接返回。前端只负责渲染，数据量翻倍仍是毫秒级。顺带把 V1 的数据做了自动迁移，旧库的乡镇、检定状态、坐标都能对上。',
      },
      {
        title: '交付时踩的坑',
        body: '采集侧写了网格切片引擎抓 POI，多关键词分页、限速、按地址/坐标/区域多维去重。部署侧用 Docker Compose 一键起（数据库初始化、healthcheck、环境变量注入、零硬编码密钥）。安全上补了登录失败限速（10 次锁 15 分钟）、双认证、路径穿越防护和操作日志。',
      },
    ],
  },
  {
    slug: 'workstation',
    result: '7×24 连续运行，95 天未重启',
    name: '个人 AI 工作站',
    subtitle: '一台旧服务器上的模型、检索与工具链',
    status: '长期运行',
    period: '2026.07 – 至今',
    stack: ['Ubuntu 24.04', 'llama.cpp', 'pgvector', 'MCP', 'systemd', 'Forgejo + CI'],
    summary: '24 核 Xeon / 62G / NVMe + 1.8T 的旧机器，托管本地模型三实例、知识库检索、MCP 网关、自建 Git 与 CI，零入站端口。',
    links: [{ label: '它到底在跑什么', to: '/post/给-ai-修工地-一台旧服务器上到底跑着什么-mvl7od2b' }],
    sections: [
      {
        title: '它承担什么',
        body: '编码 agent（pi / Codex / Claude Code / Aider）通过一个 MCP 网关拿工具：查知识库、读文档、看服务器状态、跑受控命令、调本地模型。模型自己跑，检索自己建，任务按值多少钱分档派出去。',
      },
      {
        title: '关键设计',
        body: '本地 llama.cpp 开三个实例：对话、嵌入、重排。嵌入和重排是知识库的底座，一晚上没人用也不花钱。云端模型只在两处用：审代码和架构判断。记忆分两层，结论层手写策展可直接引用，痕迹层是会话记录只当线索。',
      },
      {
        title: '运维方式',
        body: '六个 systemd timer 承担巡检、索引重建、跨端同步、会话清理；SSH 仅密钥、ufw 默认拒绝入站、对外服务只经出站隧道。知识库每天 03:00 自检引用是否失效（路径、端口、systemd 单元），失效就写进日报。',
      },
    ],
  },
  {
    slug: 'ai-daily',
    result: '每天 12 条，中文介绍由本地模型生成，无需外部 API',
    name: 'AI 项目榜',
    subtitle: '每天自己更新的 GitHub AI 榜单',
    status: '每天运行',
    period: '2026.10',
    stack: ['GitHub API', 'llama.cpp（中文摘要）', 'MySQL', 'systemd timer', 'Playwright'],
    summary: '每天 08:00 抓 GitHub 的 AI 相关项目，用本地模型写中文一句话，按 24 小时 Star 增量排出 12 条。',
    links: [{ label: '打开榜单', to: '/ai-daily' }],
    sections: [
      {
        title: '怎么来的',
        body: '六组 topic 查询抓约 120 个候选，本地 7B 模型并发 4 写中文摘要（140 秒跑完，零成本）。摘要出来后还要过一道纯规则收敛：去掉括号枚举、只留第一句、按逗号累加到 36 字、中英之间保留空格——7B 的输出不能直接用。',
      },
      {
        title: '排榜规则',
        body: '与前一天快照对比算日增：升星榜 8 条（增量降序）+ 新上榜 4 条 + 总 Star 兜底。所以榜单每天有真实变化，不是随机轮播。同一天重复导入是幂等的。',
      },
      {
        title: '两个坑',
        body: '一是 DATE 字段被驱动读成 Date 对象，UTC+8 下 toISOString 会折回前一天，榜单日期全错位；连接池加 dateStrings: [\'DATE\'] 才好。二是 rank 是 MySQL 8 的保留字，SELECT rank_no AS rank 直接语法错误，要加反引号。',
      },
    ],
  },
  {
    slug: 'notes',
    result: '52 条结论，带状态与日期，可按主题与时间线检索',
    name: '笔记（知识库）',
    subtitle: '让 AI 用得顺手的结论库，顺便公开成页面',
    status: '持续写入',
    period: '2026.09 – 至今',
    stack: ['markdown + frontmatter', 'bge-m3', 'pgvector', 'MCP', 'Node.js'],
    summary: '52 条手写结论，按项目分目录，带状态与日期。本地向量检索 + 重排，支持主题全景、演进时间线、引用体检。',
    links: [{ label: '打开笔记索引', to: '/notes' }],
    sections: [
      {
        title: '为什么手写',
        body: 'AI 每次会话都从零开始。把结论沉下来是唯一能把上下文接上的办法，但必须人工策展：一条一个判断，带 status（active / superseded / stale）和 updated 日期，检索默认只给现行结论。',
      },
      {
        title: '面向 AI 的接口',
        body: '除了单条检索，还做了三件事：一次调用拿到主题全貌（多条正文 + 演进时间线 + 冲突提示）、统一入口（结论层与痕迹层分开）、写入结构校验（正文不足 80 字或没有小节标题直接拒绝）。',
      },
      {
        title: '会自己检查过期',
        body: '每天凌晨扫一遍每条知识里提到的路径、端口、systemd 单元和容器名，探它们还在不在。第一次跑报 26 条失效，修规则后剩 4 条真问题。公网页面只放索引与脱敏后的全文。',
      },
    ],
  },
  {
    slug: 'blog',
    result: '560 条工具库、每日榜单与文章自动更新',
    name: 'woodwhite@blog',
    subtitle: '这个站点本身：博客 + 论坛 + 后台',
    status: '线上运行',
    period: '2026.07 – 至今',
    stack: ['Vue 3', 'Express 5', 'MySQL 8', 'JWT（RS256）', 'pm2 + Caddy'],
    summary: '带论坛、后台管理、编辑器、评论点赞、语义相关推荐和每日 AI 榜单的全栈站点，腾讯云单机部署。',
    links: [{ label: 'RSS 订阅', to: '/feed.xml', external: true }],
    sections: [
      {
        title: '功能面',
        body: '文章与论坛同构（post_type 区分），后台能做用户/文章/日志管理，编辑器支持 Markdown 与图片上传。评论带父子关系，点赞去重。RSS、sitemap、SEO 注入都在。',
      },
      {
        title: '鉴权踩过的坑',
        body: '认证从 HS256 换成 RS256 之后，用旧方式签的 token 全部 401。私钥在 keys/jwt_private.pem，公钥验签，JWT_SECRET 只留作回滚。发文脚本要用私钥签，别再用 secret。',
      },
      {
        title: '最近补的',
        body: '语义相关推荐（本地 bge-m3 算每篇 top3 推库）、笔记公开页、站内搜索加权与命中高亮、代码块复制、图片灯箱、字号三档、阅读进度、四个主题。每天 08:30 有个定时任务刷新派生数据。',
      },
    ],
  },
]

export const findProject = (slug) => projects.find((p) => p.slug === slug) || null
