<template>
  <div class="ws">
    <div class="ws-head">
      <h2 class="hm-h">工作站在用的项目</h2>
      <p class="ws-lead">
        一台常年开着的 Ubuntu 24.04 机器（24 核 / 62G / NVMe + 1.8T），主体是一整套本地 AI 工具链：
        模型自己跑、检索自己建、agent 之间互相当第二意见。下面按「模型 → 客户端 → 网关 → 底座」列，
        都是用了半年以上、没有替代品的。
      </p>
    </div>

    <div class="ws-groups">
      <section v-for="(group, gi) in groups" :key="group.title" class="ws-group" :data-g="gi">
        <h3 class="ws-group-title">
          <span class="ws-group-idx" aria-hidden="true">{{ String(gi + 1).padStart(2, '0') }}</span>
          {{ group.title }}
        </h3>
        <dl class="ws-list">
          <div v-for="item in group.items" :key="item.name" class="ws-item">
            <dt class="ws-name">
              <a v-if="item.href" :href="item.href" target="_blank" rel="noopener noreferrer">{{ item.name }}</a>
              <span v-else class="ws-name-plain">{{ item.name }}</span>
            </dt>
            <dd class="ws-use">
              {{ item.what }}<template v-if="item.use">，{{ item.use }}</template>
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <p class="ws-note">
      安全基线：SSH 仅密钥登录、ufw 默认拒绝入站、对外服务只经出站隧道暴露；巡检、索引重建、跨端同步由 5 个 systemd timer 轮转。
      标灰没有链接的是自己写的小工具。
    </p>
  </div>
</template>

<script setup>
const groups = [
  {
    title: '模型与检索',
    items: [
      {
        name: 'llama.cpp',
        href: 'https://github.com/ggml-org/llama.cpp',
        what: '本机跑 GGUF 模型，单卡也能推理',
        use: '开三个实例分别做对话、嵌入、重排',
      },
      {
        name: 'bge-m3',
        href: 'https://modelscope.cn/models/BAAI/bge-m3',
        what: '多语言向量模型，中文和代码都能嵌',
        use: '知识库与代码索引共用一套向量',
      },
      {
        name: 'bge-reranker-v2-m3',
        href: 'https://modelscope.cn/models/BAAI/bge-reranker-v2-m3',
        what: '检索结果重排，返回相关性 logit',
        use: '先向量粗排 20 条，再重排取 5 条',
      },
      {
        name: 'pgvector',
        href: 'https://github.com/pgvector/pgvector',
        what: 'PostgreSQL 的向量扩展，带 HNSW 索引',
        use: '向量和业务数据同库，省一套服务',
      },
    ],
  },
  {
    title: '编码 agent',
    items: [
      {
        name: 'pi',
        href: 'https://github.com/earendil-works/pi',
        what: '主力编码 agent，带扩展、subagent 与 codemode',
        use: '日常开发、审计、批量重构都走它',
      },
      {
        name: 'Codex CLI',
        href: 'https://github.com/openai/codex',
        what: 'OpenAI 的命令行 agent',
        use: '换模型做第二意见，和 pi 交叉验证结论',
      },
      {
        name: 'Claude Code',
        href: 'https://claude.com/claude-code',
        what: 'Anthropic 的终端 agent',
        use: '通过 dsh 封装跑长任务与 skill 流程',
      },
      {
        name: 'Aider',
        href: 'https://github.com/Aider-AI/aider',
        what: 'git 仓库内的一次性改码工具',
        use: '独立小任务丢给它，不自动 commit',
      },
      {
        name: 'OpenSpec',
        href: 'https://github.com/Fission-AI/OpenSpec',
        what: '规范驱动开发：先写 change 提案再实现',
        use: '大改动先落规范，避免边写边改需求',
      },
      {
        name: 'serena',
        href: 'https://github.com/oraios/serena',
        what: '代码语义检索 MCP，按符号找定义与引用',
        use: 'dsh 侧接它做跨文件定位',
      },
    ],
  },
  {
    title: '知识库与网关',
    items: [
      {
        name: 'mcp-proxy',
        href: 'https://github.com/TBXark/mcp-proxy',
        what: '把多个 MCP server 聚合成一个入口',
        use: '知识库、记忆、技能统一成一套工具给所有客户端',
      },
      {
        name: 'Agent Memory',
        href: 'https://github.com/Tencent/TencentDB-Agent-Memory',
        what: 'TencentDB 的 agent 记忆层（L0 会话 / L1 事实）',
        use: '会话痕迹自动落库，再做召回',
      },
      {
        name: 'magpie',
        what: '自建的模型网关，所有 agent 共用一个入口',
        use: '多 provider 路由、降级与用量核算',
      },
      {
        name: 'pi-subagents',
        href: 'https://www.npmjs.com/package/pi-subagents',
        what: '子代理编排与隔离执行',
        use: '便宜模型侦察、强模型审代码，按档位派活',
      },
    ],
  },
  {
    title: '代码理解与底座',
    items: [
      {
        name: 'codesym',
        what: '自建符号索引（universal-ctags）',
        use: '按符号名直接定位定义，不用 grep 翻文件',
      },
      {
        name: 'code_index',
        what: '自建代码向量索引（bge-m3）',
        use: '按功能语义找「这段逻辑在哪个文件」',
      },
      {
        name: 'gate.sh',
        what: '自建质量闸门（ruff + semgrep）',
        use: '提交前跑静态检查与安全扫描',
      },
      {
        name: 'systemd',
        href: 'https://systemd.io',
        what: '把服务、定时任务、依赖关系都交给它',
        use: '替代 nohup 和手写 cron，重启自动恢复',
      },
      {
        name: 'Forgejo',
        href: 'https://forgejo.org',
        what: '轻量自建 Git，带 CI runner',
        use: '提交即跑质量门，仓库不出自己的机器',
      },
      {
        name: 'Caddy',
        href: 'https://caddyserver.com',
        what: '配置几行就能跑的反向代理，自动签 HTTPS',
        use: '这个博客和几个工具站都在它后面',
      },
      {
        name: 'frp',
        href: 'https://github.com/fatedier/frp',
        what: '内网服务通过出站连接暴露到公网',
        use: '服务器一个入站端口都不开也能被访问',
      },
      {
        name: 'ufw / fail2ban',
        href: 'https://github.com/fail2ban/fail2ban',
        what: '防火墙默认拒绝入站 + 登录爆破自动封 IP',
        use: 'SSH 与登录接口的第一道防线',
      },
    ],
  },
]
</script>

<style scoped>
.ws { padding: 0; }
.ws-head { max-width: 82ch; }
.ws-lead {
  margin: 0 0 26px; font-size: 0.875rem; line-height: 1.72;
  color: var(--text-secondary); text-wrap: pretty;
}

.ws-groups {
  /* 四组四栏：一组一栏，不会出现第 4 组单独换行留下的空档 */
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px 36px;
}
@media (max-width: 1180px) { .ws-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) { .ws-groups { grid-template-columns: 1fr; } }
.ws-group { min-width: 0; padding: 16px 16px 18px; border-radius: 4px; }
.ws-group[data-g="0"] { background: color-mix(in srgb, var(--hue-blue) 5%, transparent); }
.ws-group[data-g="1"] { background: color-mix(in srgb, var(--hue-brick) 4%, transparent); }
.ws-group[data-g="2"] { background: color-mix(in srgb, var(--hue-teal) 5%, transparent); }
.ws-group[data-g="3"] { background: color-mix(in srgb, var(--hue-olive) 5%, transparent); }
.ws-group-title {
  display: flex; align-items: baseline; gap: 8px;
  margin: 0 0 10px; padding-bottom: 7px;
  font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600;
  letter-spacing: .08em; color: var(--text-secondary);
  border-bottom: 1px dotted var(--rule-dot-ink);
}
.ws-group-idx { color: var(--text-faint); font-weight: 400; }
.ws-list { margin: 0; padding: 0; }
.ws-item {
  display: grid; grid-template-columns: 1fr; gap: 2px;
  padding: 8px 0; align-items: baseline;
  border-bottom: 1px dotted color-mix(in srgb, var(--rule-dot-ink) 55%, transparent);
}
.ws-item:last-child { border-bottom: none; }
.ws-name {
  font-family: ui-monospace, "Noto Sans Mono CJK SC", monospace;
  font-size: 0.7812rem; font-weight: 600; line-height: 1.45;
  word-break: break-word;
}
.ws-name a {
  /* 去掉满屏下划线，改用悬停变色 */
  color: var(--text-bright); text-decoration: none;
  transition: color var(--dur-hover) var(--ease-out);
}
.ws-name a:hover { color: var(--accent); }
.ws-name a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }
.ws-name-plain { color: var(--text-dim); }
.ws-use {
  margin: 0; font-size: 0.75rem; line-height: 1.65; color: var(--text-secondary);
  min-width: 0; text-wrap: pretty;
}
.ws-note {
  margin: 28px 0 0; padding-top: 16px; border-top: 1px solid var(--border);
  font-size: 0.7812rem; line-height: 1.7; color: var(--text-dim); max-width: 84ch;
}

@media (max-width: 900px) {
  .ws-groups { grid-template-columns: 1fr; gap: 24px; }
  .ws-item { grid-template-columns: 104px 1fr; }
}
</style>
