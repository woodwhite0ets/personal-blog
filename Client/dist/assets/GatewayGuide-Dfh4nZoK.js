import{D as e,E as t,P as n,S as r,b as i,it as a,j as o,m as s,nt as c,p as l,r as u,s as d,u as f,v as p,w as m}from"./runtime-core.esm-bundler-DjSVpive.js";import{t as h}from"./ThemeSwitcher-CE3Rwh2h.js";import{t as g}from"./_plugin-vue_export-helper-BDNMzG2s.js";import{t as _}from"./SiteFooter-BL4Vy77h.js";import{n as v,t as y}from"./purify.es-CsIMUqjE.js";function b(e){return!e||typeof e!=`string`?``:y.sanitize(v.parse(e),{FORBID_ATTR:[`style`,`id`,`name`]})}var x=`# Gateway 使用文档

这套 Gateway 为 Harness、Codex 和其他 MCP 客户端提供统一入口，负责知识库检索、受控 SSH 操作、审计记录与审批。**博客账号已与网关账号打通**：登录博客后进入 \`/gateway\` 控制台会自动进入，也可用 MCP Token 登录。

---

## 1. 登录和页面

打开 \`https://blog.woodwhite.top/gateway\`：

- **已登录博客**：自动用博客账号进入（SSO）。博客用户需先被管理员在"网关权限"面板授予网关权限，否则会提示改用 Token 登录。
- **手动登录**：在登录框输入管理员分发的专属 Token（\`mcp_...\`）或博客 JWT，二者均可。

Token 不会在网页列表中回显，登录后浏览器使用会话 Cookie（8 小时）。

| 页面 | 用途 |
| --- | --- |
| 概览 | 查看当前用户可访问的知识库、SSH 服务器和角色 |
| 知识库 | 创建项目，查看、编辑和删除文档；管理员可"重建全部索引" |
| SSH 服务器 | 添加、编辑、测试和删除自己管理的服务器 |
| 审计日志 | 查看已授权的操作记录 |
| 用户与 Token | 仅管理员可见，管理用户、角色和资源权限 |

---

## 2. 角色与账号

- **admin**：管理全部项目、服务器、用户和 Token，可执行任意命令（受目标策略约束）、全量重建索引。
- **operator**：只访问管理员分配的项目和服务器，管理自己创建的资源。
- **博客账号 = 网关账号**：网关用户 id = 博客数字 id。给用户开通/管理网关权限统一到博客 \`/admin\` 的"网关权限"面板（签发 mcp_ token、设置角色/项目/服务器权限、轮换）。

权限由后端 API 和 MCP 层再次校验，不能通过隐藏网页按钮绕过。

---

## 3. 知识库：写入、索引与检索

支持 \`.md\`、\`.mdx\`、\`.txt\`、\`.yaml\`、\`.yml\`、\`.json\`，单文档最大 2 MB。路径须为项目内相对路径，禁止绝对路径、\`..\` 穿越或符号链接。默认分片 \`chunkSize=1400\`、\`chunkOverlap=160\`；配置 Embedding 时执行向量 + 全文混合检索，Embedding 暂时失败时回退全文检索。

### 3.1 如何写入知识（三种方式）

**方式一：网页控制台（推荐给普通用户）**

1. 登录 \`/gateway\` → 进入"知识库"，打开有管理权限的项目。
2. 点击"新建文档"，填相对路径，例如 \`operations/deploy.md\`。
3. 写入 Markdown 内容，保存。保存自动触发索引。

**方式二：管理 API（推荐给脚本/AI 写入）**

\`\`\`http
POST /api/gateway/projects/blog/documents
Authorization: Bearer <管理Token或博客SSO会话>
Content-Type: application/json

{ "path": "operations/deploy.md", "content": "# 部署流程\\n\\n先检查健康状态，再执行发布。" }
\`\`\`

删除：

\`\`\`http
DELETE /api/gateway/projects/blog/documents/operations/deploy.md
\`\`\`

写入和删除都会自动触发全量索引并记录审计。

**方式三：服务器文件批量同步**

把文件放到 Gateway 主机的 \`knowledge/\`（\`knowledge/global/\` 或 \`knowledge/projects/<project-id>/\`），再执行：

\`\`\`bash
docker compose --profile index run --rm indexer
\`\`\`

### 3.2 索引管理

- **自动**：网页/API 写入文档时自动重建。
- **手动全量重建**：控制台"知识库"视图点"重建全部索引"（管理员），等价于运行 indexer。
- **定时全量重建**：每天 04:17 自动执行（systemd 定时器，关机错过的会补跑），日志在网关主机的 \`logs/indexer-cron.log\`。

重建完成后查看 \`files\` / \`chunks\` / \`embeddings\` / \`embedding_errors\`；\`embedding_errors > 0\` 不代表失败（部分分片缺向量仍可用关键词检索）。

### 3.3 检索

Harness/Codex 通过 MCP 工具检索：\`search_knowledge(project, query, limit)\` 返回按相关度排序的分片；\`read_document(project, path)\` 读取原文。结果返回前会脱敏。

**使用例子（Harness 对话）：**

> 用户：先看博客项目里有没有"部署前检查"的资料
> Harness 调用：\`search_knowledge(project="blog", query="部署前检查 发布")\`
> 结果含 \`operations/deploy.md\` 分片 → 再调 \`read_document(project="blog", path="operations/deploy.md")\` 读全文。

---

## 4. SSH 服务器

添加服务器时填写：服务器 ID、主机、端口、**非 root 用户**、关联项目、known_hosts、认证方式（私钥或密码二选一）。

私钥可上传文件或粘贴：

\`\`\`text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
\`\`\`

known_hosts 示例：

\`\`\`text
192.0.2.10 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleHostKey gateway-server
\`\`\`

- 凭据服务端**加密保存**，不会出现在列表、API 返回、知识库或审计日志中；编辑时认证字段留空 = 保留原凭据。
- 保存后可"测试连接"——只执行一次跨平台的 \`echo\` 连通性探针，Windows/WSL2 目标同样适用。
- **目标主机限制**：默认禁止回环、内网、链路本地等私网地址作为 SSH 目标（防 SSRF/横向移动）；确有内网目标时由管理员在网关 \`.env\` 设置 \`ALLOW_PRIVATE_TARGET_HOSTS=true\`。

---

## 5. MCP 客户端接入（Harness / Codex）

MCP 端点地址：\`https://blog.woodwhite.top/mcp\`（经博客 Caddy 隧道到网关）。

### 5.1 获取并保存 Token

由管理员分发专属明文 Token，只存在你电脑的环境变量或 Harness 密钥配置里：

\`\`\`powershell
# Windows PowerShell
$env:MCP_GATEWAY_TOKEN = "管理员分发的专属 Token"
\`\`\`

\`\`\`bash
# Linux/macOS
export MCP_GATEWAY_TOKEN='管理员分发的专属 Token'
\`\`\`

不要使用数据库里的 token_hash，不要把 Token 提交到 Git。

### 5.2 配置 MCP Server

\`\`\`yaml
name: woodwhite-gateway
transport: streamable-http
url: https://blog.woodwhite.top/mcp
headers:
  Authorization: Bearer \${MCP_GATEWAY_TOKEN}
\`\`\`

连接成功后工具列表应包含：\`list_projects\`、\`list_targets\`、\`get_constraints\`、\`search_knowledge\`、\`read_document\`、\`inspect_server\`、\`read_logs\`、\`run_command\`、\`list_pending_approvals\`、\`decide_approval\`。建议先调 \`list_projects\` 和 \`list_targets\` 确认权限范围。

### 5.3 使用例子

**查询项目知识**：

> Harness：\`search_knowledge(project="blog", query="博客 500 报错 排查", limit=3)\`
> → 返回相关分片（含路径/标题），再 \`read_document\` 读全文。

**查看服务器实时状态**：

> Harness：\`inspect_server(target="woodwhite-personal-blog-service", check="disk")\`
> → 返回磁盘使用情况。

**读服务日志**：

> Harness：\`read_logs(target="woodwhite-personal-blog-service", service="blog", lines=50)\`

**执行只读命令（自动允许）**：

> Harness：\`run_command(target="woodwhite-personal-blog-service", command="df -h")\`
> → \`df -h\` 在目标自动白名单内，直接执行返回结果。

**执行需要审批的命令**：

> Harness：\`run_command(target="woodwhite-personal-blog-service", command="systemctl restart blog")\`
> → 命令命中审批列表 → 返回 \`approval_required\` + approval_id。
> 随后调用 \`list_pending_approvals()\` 查看待审批项，管理员在网关控制台"审计日志"或通过 \`decide_approval(approval_id, decision="approved")\` 批准后重试。

---

## 6. 安全与排错

### 安全要点

- 每个用户独立 Token，离职/泄露立即删除或轮换（管理员在 /admin 网关面板操作）。
- 保留 known_hosts，不要关闭主机指纹校验。
- SSH 用非 root 专用用户，最小权限。
- \`auth.yaml\`、\`targets.yaml\`、\`.env\`、\`secrets/\` 和 \`Server/keys/\` 不得提交 Git。
- 高风险命令需审批；客户端不能传入任意主机地址。
- 不要把私钥、Token、密码、数据库连接串写进知识库文档。

### 排错清单

| 现象 | 检查 |
| --- | --- |
| 登录 401/400 | 使用明文 Token（非哈希）；或博客账号未开通网关权限 → 到 /admin 网关面板授予 |
| Harness 401 | 确认发送了 \`Authorization: Bearer <Token>\` |
| Harness 404 | 确认用的是 \`/mcp\`，不是网页 API 地址 |
| MCP initialization required | 确认用 Streamable HTTP，不是普通 REST |
| SSH 保存失败 | known_hosts、凭据、项目 ID、非 root 用户 |
| 搜索为空 | 文件扩展名、项目目录，重新索引 |
| 只有旧内容 | 文件真的写进了当前 \`knowledge/\`，重新执行 indexer 或点"重建全部索引" |
| 命令被拒 | 检查目标 auto_commands/approval_commands，或是否需要审批 |
`,S={class:`gateway-page gateway-guide-page`},C={class:`navbar`},w={class:`navbar-inner`},T={class:`nav-actions`},E={class:`guide-layout`},D={class:`guide-sidebar terminal-panel`},O={class:`guide-nav`,"aria-label":`文档目录`},k=[`href`,`data-section-id`],A={class:`terminal-panel guide-panel`},j=[`innerHTML`],M=g({__name:`GatewayGuide`,setup(g){let v=n([]),y=n(``),M;function N(e){return String(e||``).trim().toLowerCase().replace(/\./g,``).replace(/\s+/g,`-`).replace(/[^\w一-龥-]/g,``).replace(/-+/g,`-`)}let P=n(``);function F(){let e=b(x);if(typeof DOMParser>`u`){P.value=e,v.value=[];return}let t=new DOMParser().parseFromString(e,`text/html`),n=Array.from(t.querySelectorAll(`h1, h2`)).map(e=>{let t=N(e.textContent);return e.id=t,{id:t,label:e.textContent.trim()}});v.value=n,y.value=n[0]?.id??``,P.value=t.body.innerHTML}function I(e){e.preventDefault();let t=e.currentTarget.dataset.sectionId,n=t?document.getElementById(t):null;n&&(y.value=t,n.scrollIntoView({behavior:`smooth`,block:`start`}),history.replaceState(null,``,`#${encodeURIComponent(t)}`))}function L(){let e=window.location.hash.slice(1);if(!e)return``;try{return decodeURIComponent(e)}catch{return e}}function R(){let e=L();if(!e)return;let t=document.getElementById(e);t&&(y.value=e,t.scrollIntoView({behavior:`auto`,block:`start`}))}function z(){let e=v.value.map(e=>document.getElementById(e.id)).filter(Boolean);if(!e.length)return;let t=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-8?e.at(-1):e.filter(e=>e.getBoundingClientRect().top<=120).at(-1);y.value=(t??e[0]).id}function B(){M||=window.requestAnimationFrame(()=>{M=void 0,z()})}return r(async()=>{F(),await p(),R(),z(),window.addEventListener(`scroll`,B,{passive:!0})}),i(()=>{window.removeEventListener(`scroll`,B),M&&window.cancelAnimationFrame(M)}),(n,r)=>{let i=e(`router-link`);return m(),f(`div`,S,[r[6]||=d(`div`,{class:`bg-grid`},null,-1),r[7]||=d(`div`,{class:`bg-scanline`},null,-1),d(`header`,C,[d(`div`,w,[s(i,{to:`/gateway`,class:`brand`},{default:o(()=>[...r[0]||=[d(`span`,{class:`brand-bracket`},`[`,-1),d(`span`,{class:`brand-text`},`woodwhite@blog`,-1),d(`span`,{class:`brand-bracket`},`]`,-1),d(`span`,{class:`brand-path`},`~/gateway/docs`,-1)]]),_:1}),d(`div`,T,[s(h),r[1]||=d(`span`,{class:`gateway-badge`},`MCP DOCUMENTATION`,-1),r[2]||=d(`a`,{href:`/HomePage`,class:`nav-link`},`返回博客`,-1)])])]),d(`main`,E,[d(`aside`,D,[r[4]||=d(`div`,{class:`panel-bar`},[d(`span`,{class:`panel-dot dot-cyan`}),d(`span`,{class:`panel-dot dot-cyan dim`}),d(`span`,{class:`panel-title`},`docs.index`)],-1),d(`nav`,O,[(m(!0),f(u,null,t(v.value,e=>(m(),f(`a`,{key:e.id,href:`#`+e.id,"data-section-id":e.id,class:c({active:y.value===e.id}),onClick:I},a(e.label),11,k))),128))]),s(i,{to:`/gateway`,class:`btn-secondary guide-back`},{default:o(()=>[...r[3]||=[l(`返回 Gateway`,-1)]]),_:1})]),d(`article`,A,[r[5]||=d(`div`,{class:`panel-bar`},[d(`span`,{class:`panel-dot dot-cyan`}),d(`span`,{class:`panel-dot dot-cyan dim`}),d(`span`,{class:`panel-title`},`cat docs/USAGE.md`)],-1),d(`div`,{class:`guide-content markdown-body`,innerHTML:P.value},null,8,j)])]),s(_,{command:`cat docs/USAGE.md`})])}}},[[`__scopeId`,`data-v-a05c2cb0`]]);export{M as default};