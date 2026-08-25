# Gateway 使用文档

这套 Gateway 为 Harness、Codex 和其他 MCP 客户端提供统一入口，负责知识库检索、受控 SSH 操作和审计记录。

## 1. 登录和页面

打开 /gateway，使用管理员分发的 Gateway Token 登录。Token 不会在网页列表中回显，登录后浏览器使用会话 Cookie。

| 页面 | 用途 |
| --- | --- |
| 概览 | 查看当前用户可访问的知识库、SSH 服务器和角色 |
| 知识库 | 创建项目，查看、编辑和删除文档 |
| SSH 服务器 | 添加、编辑、测试和删除自己管理的服务器 |
| 审计日志 | 查看已授权的操作记录 |
| 用户与 Token | 仅管理员可见，管理用户、角色和资源权限 |

## 2. 角色权限

管理员可以管理全部项目、服务器、用户和 Token。操作员只能访问管理员分配的项目和服务器，并管理自己创建的资源。权限由后端 API 和 MCP 层再次校验，不能通过隐藏网页按钮绕过。

## 3. 知识库和索引

支持 .md、.mdx、.txt、.yaml、.yml 和 .json。保存文档后会触发索引更新；索引器会进行结构化分片，配置 Embedding 时执行向量和全文混合搜索，Embedding 暂时失败时回退到全文检索。

默认分片参数为 chunkSize=1400、chunkOverlap=160，分片会保留标题上下文、序号、扩展名和内容哈希。

批量同步文件或修改分片策略后，在 Gateway 主机执行全量重建：

~~~bash
docker compose --profile index run --rm indexer
~~~

重点查看 files、chunks、embeddings 和 embedding_errors。Embedding 失败不应阻断文本分片写入。

### 3.1 如何将知识写入知识库

普通用户推荐通过网页写入：登录 `/gateway` 后进入“知识库”，打开有管理权限的项目，点击“新建文档”，填写项目内的相对路径（例如 `operations/deploy.md`），写入内容后保存。编辑已有文档时打开对应路径即可。保存会自动触发索引，等待页面提示完成后再测试搜索。

支持的文件类型是 `.md`、`.mdx`、`.txt`、`.yaml`、`.yml` 和 `.json`，单个文档最大 2 MB。路径不能是绝对路径，不能包含 `..` 穿越目录或符号链接。操作员只能写入自己拥有管理权限的项目，管理员可以管理全部项目。

批量导入或从代码仓库同步时，把文件放到 Gateway 主机的以下目录：

~~~text
knowledge/global/                    # 全局约束和共享知识
knowledge/projects/<project-id>/      # 某个项目的知识
~~~

然后在 Gateway 项目目录执行全量重建：

~~~bash
docker compose --profile index run --rm indexer
~~~

索引器完成后检查 `files`、`chunks`、`embeddings` 和 `embedding_errors`。当前 MCP 工具只有 `list_projects`、`search_knowledge` 和 `read_document` 等读取能力，没有 `write_document`；Harness 需要写入时，应使用网页、管理 API 或服务器文件同步，避免未经审核的模型输出直接进入长期知识。

推荐把稳定的架构、部署、限制、故障处理写入知识库；当前进程、磁盘空间和最新日志等易变信息应通过 SSH 工具实时读取。不要把 Token、密码、SSH 私钥或数据库连接串写入文档。知识库系统自身的完整架构和维护说明位于独立的 `knowledge-base` 项目，文档路径为 `knowledge-base-project.md`，可在“知识库”页面打开查看。它与 `global` 项目分开管理，需要单独的项目访问权限。

## 4. SSH 服务器

添加服务器时需要填写服务器 ID、主机、端口、非 root 用户、关联项目、known_hosts 和认证方式。认证方式选择私钥或密码之一。

私钥可以上传文件或粘贴，常见格式为：

~~~text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
~~~

密码和私钥会在服务端加密保存，不会出现在列表、API 返回、知识库或审计日志中。编辑时认证字段留空表示保留原凭据。

known_hosts 示例：

~~~text
192.0.2.10 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExampleHostKey gateway-server
~~~

ssh-ed25519 和 ecdsa-sha2-nistp256 是不同的主机密钥算法标识，不是需要手动选择的登录协议。保存后可以测试连接，测试只执行一次跨平台的 echo 连通性探针（不运行 uname 等 Linux 命令），Windows/WSL2 目标同样适用。

## 5. MCP 客户端与 Harness

MCP 客户端连接 Gateway 的 /mcp，使用 Bearer Token。当前 Gateway 地址是：

~~~text
https://blog.woodwhite.top/mcp
~~~

这里是 MCP 接口地址，不是网页登录接口。不要使用 /api/auth/login、/api/me 或 /gateway 代替它，也不要把 SSH 私钥放进提示词或 MCP 消息。

### 5.1 获取并保存 Token

由管理员为你分发专属明文 Token。Token 只需要保存在你自己的电脑环境变量或 Harness 的密钥配置中，不要使用数据库里的 token_hash，也不要把 Token 提交到 Git。

Windows PowerShell：

~~~powershell
$env:MCP_GATEWAY_TOKEN = "管理员分发的专属 Token"
~~~

Linux/macOS：

~~~bash
export MCP_GATEWAY_TOKEN='管理员分发的专属 Token'
~~~

### 5.2 连接你自己的 Harness

在 Harness 的 MCP/Tools/Integrations 设置中新增一个远程 MCP Server，配置以下内容：

~~~yaml
name: woodwhite-gateway
transport: streamable-http
url: https://blog.woodwhite.top/mcp
headers:
  Authorization: Bearer ${MCP_GATEWAY_TOKEN}
~~~

如果你的 Harness 使用 JSON 配置，等价配置如下：

~~~json
{
  "name": "woodwhite-gateway",
  "transport": "streamable-http",
  "url": "https://blog.woodwhite.top/mcp",
  "headers": {
    "Authorization": "Bearer ${MCP_GATEWAY_TOKEN}"
  }
}
~~~

不同版本的 Harness 可能把字段命名为 url、endpoint、headers 或 env。保持三项不变即可：远程 Streamable HTTP、地址为 https://blog.woodwhite.top/mcp、请求头为 Authorization: Bearer <你的 Token>。如果 Harness 支持从环境变量引用密钥，优先使用 MCP_GATEWAY_TOKEN，不要把 Token 直接写进项目配置。

保存配置后重启 Harness，或重新加载 MCP 连接。连接成功后，在工具列表中应看到 list_projects、list_targets、get_constraints、search_knowledge、read_document、inspect_server、read_logs 和 run_command 等工具。建议先调用 list_projects 和 list_targets，确认当前账号能看到的知识库和 SSH 服务器，再执行后续操作。

## 6. 安全和排错

- 每个用户使用独立 Token，离职或泄露后立即删除或轮换。
- 保留 known_hosts，不要关闭主机指纹校验。
- SSH 使用非 root 专用用户，配置最小权限。
- auth.yaml、targets.yaml、.env 和 secrets/ 不得提交 Git。
- 高风险命令需要审批；不要让客户端传入任意主机地址。

登录 401/400 时确认使用的是明文 Token 而不是哈希。Harness 返回 401 时检查是否发送了 Authorization: Bearer <Token>；返回 404 时检查是否误用了网页 API 地址；出现 MCP initialization required 时确认 Harness 使用的是 MCP Streamable HTTP，而不是普通 REST 请求。SSH 保存失败时检查 known_hosts、认证凭据、项目 ID 和非 root 用户。搜索为空时确认文件扩展名和项目目录，并重新运行索引器；Embedding 异常时可先用关键词搜索验证全文回退。
