<template>
  <div class="gateway-page">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/gateway</span>
        </router-link>
        <div class="nav-actions">
          <ThemeSwitcher />
          <span class="gateway-badge">MCP CONTROL PLANE</span>
          <router-link to="/gateway/docs" class="nav-link">使用文档</router-link>
        <router-link to="/HomePage" class="nav-link">返回博客</router-link>
        </div>
      </div>
    </header>

    <main v-if="!user" class="login-layout">
      <section class="terminal-panel login-panel">
        <div class="panel-bar">
          <span class="panel-dot dot-cyan"></span>
          <span class="panel-dot dot-cyan dim"></span>
          <span class="panel-title">mcp-gateway.login</span>
        </div>
        <div class="panel-content">
          <p class="eyebrow">AUTHENTICATED CONTROL PLANE</p>
          <h1>连接知识库 Gateway</h1>
          <p class="muted">使用管理员分发的专属 Token 管理知识库和 SSH 服务器。</p>
          <form @submit.prevent="login">
            <label for="gateway-token">Gateway Token</label>
            <input id="gateway-token" v-model="token" type="password" autocomplete="off" required placeholder="mcp_..." />
            <button class="btn btn-primary btn-block full-width" type="submit" :disabled="busy">{{ busy ? '验证中...' : '登录 Gateway' }}</button>
          </form>
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </div>
      </section>
    </main>

    <main v-else class="main-layout">
      <aside class="sidebar">
        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">cat /etc/gateway/menu</span>
          </div>
          <div class="panel-body nav-body">
            <button v-for="item in navItems" v-show="item.id !== 'users' || user.role === 'admin'" :key="item.id" class="nav-item" :class="{ active: view === item.id }" @click="selectView(item.id)">
              <span class="nav-num">{{ item.num }}</span> {{ item.label }}
            </button>
          </div>
        </div>
        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-green"></span>
            <span class="panel-dot dot-green dim"></span>
            <span class="panel-title">gateway.session</span>
          </div>
          <div class="panel-body">
            <div class="info-line"><span class="info-key">用户</span><span class="info-val">{{ user.display_name }}<template v-if="user.username"> @{{ user.username }}</template></span></div>
            <div class="info-line"><span class="info-key">角色</span><span class="info-val terminal-green">{{ user.role }}</span></div>
            <div class="info-line"><span class="info-key">协议</span><span class="info-val">MCP / SSH</span></div>
          </div>
        </div>
        <button class="logout-button" @click="logout">退出 Gateway</button>
      </aside>

      <section class="content">
        <div class="content-heading">
          <div>
            <p class="eyebrow">MCP CONTROL PLANE</p>
            <h1>{{ currentTitle }}</h1>
          </div>
          <p class="status" :class="{ 'status-error': statusError }">{{ statusMessage }}</p>
        </div>

        <section v-if="view === 'overview'" class="view-stack">
          <div class="metric-grid">
            <div class="terminal-panel metric-card"><span class="metric-label">可用知识库</span><strong>{{ projects.length }}</strong><span class="metric-code">projects.visible</span></div>
            <div class="terminal-panel metric-card"><span class="metric-label">可用 SSH 服务器</span><strong>{{ targets.length }}</strong><span class="metric-code">targets.visible</span></div>
            <div class="terminal-panel metric-card"><span class="metric-label">当前角色</span><strong class="role-value">{{ user.role }}</strong><span class="metric-code">session.authorized</span></div><div class="terminal-panel metric-card"><span class="metric-label">技能</span><strong>{{ skills.length }}</strong><span class="metric-code">skills.visible</span></div>
          </div>
          <div class="terminal-panel">
            <div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">gateway.status</span></div>
            <div class="panel-content"><h2>资源概览</h2><p class="muted">当前页面只显示此 Token 有权访问的项目和服务器。MCP 客户端可使用同一 Token 调用 Gateway。</p><div class="status-line"><span class="status-dot"></span> Gateway session active</div></div>
          </div>
        </section>

        <section v-else-if="view === 'projects'" class="view-stack">
          <div class="toolbar"><p class="muted">文档保存后会自动触发索引。</p><div class="toolbar-actions"><button v-if="user.role === 'admin'" class="btn btn-secondary" :disabled="reindexing" @click="reindexAll">{{ reindexing ? '重建中...' : '重建全部索引' }}</button><button class="btn btn-primary" @click="createProject">新建知识库</button></div></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">projects.list</span></div><div class="table-wrap"><table><thead><tr><th>项目</th><th>文档数</th><th>分片数</th><th>归属</th><th>操作</th></tr></thead><tbody><tr v-for="item in projects" :key="item.id"><td><strong>{{ item.id }}</strong></td><td>{{ item.documents.length }}</td><td>{{ item.chunk_count ?? 0 }}</td><td>{{ item.owner_id || '系统项目' }}</td><td><button v-if="item.manageable" class="btn btn-secondary btn-sm" @click="openProject(item.id)">打开</button><button v-if="item.manageable" class="btn btn-danger btn-sm" @click="deleteProject(item.id)">删除</button><span v-else class="muted">只读</span></td></tr><tr v-if="!projects.length"><td colspan="5" class="empty">暂无知识库</td></tr></tbody></table></div></div>
        </section>

        <section v-else-if="view === 'project'" class="view-stack">
          <div class="toolbar"><button class="btn btn-secondary" @click="selectView('projects')">返回项目</button><button class="btn btn-primary" @click="editDocument(projectId, '', '')">新建文档</button></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">project / {{ projectId }}</span></div><div class="table-wrap"><table><thead><tr><th>路径</th><th>大小</th><th>分片</th><th>更新时间</th><th>操作</th></tr></thead><tbody><tr v-for="doc in documents" :key="doc.path"><td><strong>{{ doc.path }}</strong></td><td>{{ doc.bytes }} B</td><td><strong>{{ doc.chunk_count ?? 0 }}</strong><br><span class="tag">Embedding {{ doc.embedded_chunk_count ?? 0 }}</span></td><td>{{ formatDate(doc.updated_at) }}</td><td><button class="btn btn-secondary btn-sm" @click="readDocument(doc.path)">编辑</button><button class="btn btn-danger btn-sm" @click="deleteDocument(doc.path)">删除</button></td></tr><tr v-if="!documents.length"><td colspan="5" class="empty">暂无文档</td></tr></tbody></table></div></div>
        </section>

        <section v-else-if="view === 'document'" class="view-stack">
          <div class="toolbar"><button class="btn btn-secondary" @click="openProject(projectId)">返回文档</button></div>
          <div class="terminal-panel form-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">document.editor</span></div><div class="panel-content"><h2>{{ documentPath ? `编辑 ${documentPath}` : '新建文档' }}</h2><p class="muted">{{ projectId }}</p><label v-if="!documentPath" for="document-path">路径</label><input v-if="!documentPath" id="document-path" v-model="documentDraft.path" placeholder="notes.md" /><label for="document-content">内容</label><textarea id="document-content" v-model="documentDraft.content" rows="16"></textarea><div class="actions"><button class="btn btn-primary" @click="saveDocument">保存并索引</button></div></div></div>
        </section>

        <section v-else-if="view === 'skills'" class="view-stack">
          <div class="toolbar"><p class="muted">技能包是 AI 可调用的操作手册，按项目隔离。保存直接写入 knowledge/skills，不参与知识库索引。</p><div class="toolbar-actions"><button class="btn btn-secondary" @click="toggleImport">GitHub 导入</button><button class="btn btn-primary" @click="newSkill">新建技能</button></div></div>
          <div v-if="importOpen" class="terminal-panel form-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">skills.import</span></div><div class="panel-content"><div class="form-grid"><div><label for="import-url">GitHub 链接</label><input id="import-url" v-model="importDraft.url" placeholder="https://github.com/vuejs-ai/skills/tree/main/skills/vue-best-practices" /></div><div><label for="import-project">目标项目</label><select id="import-project" v-model="importDraft.project"><option value="global">global（所有项目可用）</option><option v-for="item in projects" :key="item.id" :value="item.id">{{ item.id }}</option></select></div></div><template v-if="importMultiple.length"><p class="muted">仓库中有 {{ importMultiple.length }} 个 skill，点选导入：</p><div class="import-options"><button v-for="m in importMultiple" :key="m.path" class="btn btn-secondary" @click="doImport(importDraft.url, importDraft.project, m.path)">{{ m.id }}</button></div></template><div class="actions"><button class="btn btn-primary" :disabled="importing" @click="doImport(importDraft.url, importDraft.project)">{{ importing ? '导入中...' : '导入' }}</button><button class="btn btn-secondary" @click="closeImport">取消</button></div></div></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">skills.list</span></div><div class="table-wrap"><table><thead><tr><th>项目</th><th>名称</th><th>描述</th><th>版本</th><th>状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in skills" :key="item.project + '/' + item.id"><td><strong>{{ item.project }}</strong></td><td><strong>{{ item.name }}</strong><br><span class="tag">{{ item.id }}</span></td><td>{{ item.description || '-' }}<br><span class="tag" :class="item.description_lang === 'zh' ? 'status-ok' : ''">{{ item.description_lang === 'zh' ? '中文' : 'EN' }}简介</span></td><td>{{ item.version }}<br><span v-if="item.source" class="tag">{{ item.source.replace('https://github.com/','').split('/tree')[0] }}</span></td><td><span :class="item.state === 'published' ? 'status-ok' : 'muted'">{{ item.state }}</span></td><td><button class="btn btn-secondary btn-sm" @click="readSkill(item.project, item.id)">编辑</button><button class="btn btn-danger btn-sm" @click="deleteSkill(item.project, item.id)">删除</button></td></tr><tr v-if="!skills.length"><td colspan="6" class="empty">暂无技能</td></tr></tbody></table></div></div>
        </section>

        <section v-else-if="view === 'skill'" class="view-stack">
          <div class="toolbar"><button class="btn btn-secondary" @click="selectView('skills')">返回技能</button></div>
          <div class="terminal-panel form-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">skill.editor</span></div><div class="panel-content"><h2>{{ skillDraft.id ? `编辑 ${skillDraft.project}/${skillDraft.id}` : '新建技能' }}</h2><p class="muted">内容需包含 frontmatter（name / description / version / state / triggers）。</p><div class="form-grid"><div><label for="skill-project">项目</label><select id="skill-project" v-model="skillDraft.project" :disabled="Boolean(skillDraft.id)"><option v-for="item in projects" :key="item.id" :value="item.id">{{ item.id }}</option></select></div><div><label for="skill-id">技能 ID</label><input id="skill-id" v-model="skillDraft.id" :disabled="Boolean(skillDraft.id)" placeholder="deploy-blog" /></div></div><label for="skill-content">内容</label><textarea id="skill-content" v-model="skillDraft.content" rows="20"></textarea><div class="actions"><button class="btn btn-primary" @click="saveSkill">保存技能</button></div></div></div>
        </section>

        <section v-else-if="view === 'targets'" class="view-stack">
          <div class="toolbar"><p class="muted">SSH 私钥只上传并加密保存，页面不会回显。</p><button class="btn btn-primary" @click="newTarget">添加服务器</button></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">targets.list</span></div><div class="table-wrap"><table><thead><tr><th>名称</th><th>地址</th><th>用户</th><th>项目</th><th>操作</th></tr></thead><tbody><tr v-for="item in targets" :key="item.id"><td><strong>{{ item.label }}</strong><br><span class="tag">{{ item.id }}</span></td><td>{{ item.host }}:{{ item.port }}</td><td>{{ item.user }}</td><td>{{ item.project || '-' }}</td><td><template v-if="item.manageable"><button class="btn btn-secondary btn-sm" @click="editTarget(item)">编辑</button><button class="btn btn-secondary btn-sm" @click="testTarget(item.id)">测试</button><button class="btn btn-danger btn-sm" @click="deleteTarget(item.id)">删除</button></template><span v-else class="muted">只读</span></td></tr><tr v-if="!targets.length"><td colspan="5" class="empty">暂无 SSH 服务器</td></tr></tbody></table></div></div>
        </section>

        <form v-else-if="view === 'target-form'" class="view-stack" @submit.prevent="saveTarget">
          <div class="toolbar"><button type="button" class="btn btn-secondary" @click="selectView('targets')">返回服务器</button></div>
          <div class="terminal-panel form-panel">
            <div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">target.provision</span></div>
            <div class="panel-content">
              <p v-if="editingTargetId" class="muted target-id-note">Renaming the ID updates permissions, database references, and the managed secret directory. Historical audit records keep the old ID.</p>
              <h2>{{ editingTargetId ? '编辑 SSH 服务器' : '添加 SSH 服务器' }}</h2>
              <div class="form-grid">
                <div><label for="target-id">ID</label><input id="target-id" v-model.trim="targetDraft.id" pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,63}" title="Starts with a letter or number; up to 64 letters, numbers, underscores, or hyphens" /></div>
                <div><label for="target-label">显示名称</label><input id="target-label" v-model="targetDraft.label" /></div>
                <div><label for="target-host">主机</label><input id="target-host" v-model="targetDraft.host" /></div>
                <div><label for="target-port">端口</label><input id="target-port" v-model.number="targetDraft.port" type="number" min="1" max="65535" /></div>
                <div><label for="target-user">SSH 用户</label><input id="target-user" v-model="targetDraft.user" /></div>
                <div><label for="target-project">知识库项目</label><input id="target-project" v-model="targetDraft.project" /></div>
                <div>
                  <label for="target-auth-method">认证方式</label>
                  <select id="target-auth-method" v-model="targetDraft.auth_method">
                    <option value="private_key">SSH 私钥</option>
                    <option value="password">账号密码</option>
                  </select>
                </div>
              </div>
              <template v-if="targetDraft.auth_method === 'private_key'">
                <label for="private-key-file">上传私钥文件</label>
                <input id="private-key-file" type="file" accept=".pem,.key,.openssh" @change="loadPrivateKeyFile" />
                <p class="muted">也可以继续使用下方文本框粘贴私钥，服务端只保存加密后的内容。</p>
                <label for="private-key">SSH 私钥</label>
                <textarea id="private-key" v-model="targetDraft.private_key" rows="7" placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"></textarea>
              </template>
              <template v-else>
                <label for="target-password">SSH 密码</label>
                <input id="target-password" v-model="targetDraft.password" type="password" autocomplete="new-password" />
                <p class="muted">密码会单独加密保存，不会写入配置、接口返回值或审计日志。</p>
              </template>
              <label for="known-hosts">known_hosts</label>
              <textarea id="known-hosts" v-model="targetDraft.known_hosts" rows="4" placeholder="服务器公钥指纹"></textarea>
              <div class="actions"><button class="btn btn-primary" type="submit">加密保存</button></div>
            </div>
          </div>
        </form>

        <section v-else-if="view === 'audit'" class="view-stack">
          <div class="toolbar"><p class="muted">共 {{ auditTotal }} 条记录</p><div class="toolbar-actions"><button class="btn btn-secondary" :disabled="auditPage <= 1" @click="loadAudit(auditPage - 1)">上一页</button><span class="pager-info">{{ auditPage }} / {{ auditPages }}</span><select class="pager-select" v-model.number="auditSize" @change="loadAudit(1, auditSize)"><option :value="50">50</option><option :value="100">100</option><option :value="200">200</option></select><button class="btn btn-secondary" :disabled="auditPage >= auditPages" @click="loadAudit(auditPage + 1)">下一页</button></div></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">audit.log</span></div><div class="table-wrap"><table><thead><tr><th>时间</th><th>用户</th><th>操作</th><th>资源</th><th>结果</th></tr></thead><tbody><tr v-for="row in auditRows" :key="row.id || `${row.created_at}-${row.action}`"><td>{{ formatDate(row.created_at) }}</td><td>{{ row.user_id }}</td><td>{{ row.action }}</td><td>{{ row.project || row.target_id || '-' }}</td><td :class="{ 'status-error': row.success === false, 'status-ok': row.success === true }">{{ row.success === true ? '成功' : row.success === false ? '失败' : '-' }}</td></tr><tr v-if="!auditRows.length"><td colspan="5" class="empty">暂无审计记录</td></tr></tbody></table></div></div></section>

        <section v-else-if="view === 'users'" class="view-stack">
          <div class="toolbar"><p class="muted">管理员可以管理所有用户的角色、知识库项目和 SSH 服务器访问权限。</p><button class="btn btn-primary" @click="createUser">创建用户</button></div>
          <div v-if="newToken" class="token-notice"><strong>请立即保存此 Token</strong><code>{{ newToken }}</code></div>
          <div v-if="editingUserId" class="terminal-panel form-panel user-permission-panel">
            <div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">user.permissions</span></div>
            <div class="panel-content">
              <div class="content-heading compact"><div><p class="eyebrow">ADMINISTRATOR ONLY</p><h2>编辑用户权限</h2></div><button class="btn btn-secondary" type="button" @click="cancelEditUser">取消</button></div>
              <div class="form-grid"><div><label for="user-display-name">显示名称</label><input id="user-display-name" v-model="userDraft.display_name" /></div><div><label for="user-role">角色</label><select id="user-role" v-model="userDraft.role"><option value="operator">operator：受限操作员</option><option value="admin">admin：管理员</option></select></div></div>
              <div class="access-section"><h3>知识库项目</h3><div class="access-grid"><label v-for="item in projects" :key="item.id" class="check-option"><input v-model="userDraft.allowed_projects" type="checkbox" :value="item.id" /><span>{{ item.id }}</span></label><span v-if="!projects.length" class="muted">暂无项目</span></div></div>
              <div class="access-section"><h3>SSH 服务器</h3><div class="access-grid"><label v-for="item in targets" :key="item.id" class="check-option"><input v-model="userDraft.allowed_targets" type="checkbox" :value="item.id" /><span>{{ item.id }}</span></label><span v-if="!targets.length" class="muted">暂无服务器</span></div></div>
              <div class="actions"><button class="btn btn-primary" type="button" @click="saveUserPermissions">保存权限</button></div>
            </div>
          </div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">users.permissions</span></div><div class="table-wrap"><table><thead><tr><th>用户</th><th>角色</th><th>项目权限</th><th>服务器权限</th><th>操作</th></tr></thead><tbody><tr v-for="item in users" :key="item.id"><td><strong>{{ item.display_name }}</strong><br><span class="tag">{{ item.id }}</span></td><td>{{ item.role }}</td><td>{{ item.role === 'admin' ? '全部' : item.allowed_projects.length }}</td><td>{{ item.role === 'admin' ? '全部' : item.allowed_targets.length }}</td><td><button class="btn btn-secondary btn-sm" @click="editUser(item)">编辑权限</button><button class="btn btn-secondary btn-sm" @click="rotateUser(item.id)">轮换 Token</button><button v-if="item.id !== user.id" class="btn btn-danger btn-sm" @click="deleteUser(item.id)">删除</button></td></tr><tr v-if="!users.length"><td colspan="5" class="empty">暂无用户</td></tr></tbody></table></div></div>
        </section>

        <section v-else-if="view === 'ai'" class="view-stack">
          <div class="metric-grid">
            <div class="terminal-panel metric-card"><span class="metric-label">对话历史</span><strong>{{ conversations.length }}</strong><span class="metric-code">history.stored</span></div>
            <div class="terminal-panel metric-card"><span class="metric-label">提示词模板</span><strong>{{ promptFiles.length }}</strong><span class="metric-code">prompts.count</span></div>
            <div class="terminal-panel metric-card"><span class="metric-label">AI 产物</span><strong>{{ artifactFiles.length }}</strong><span class="metric-code">artifacts.count</span></div>
            <div class="terminal-panel metric-card"><span class="metric-label">技能</span><strong>{{ skills.length }}</strong><span class="metric-code">skills.visible</span></div>
          </div>
          <div class="toolbar"><div class="toolbar-actions"><button class="btn btn-secondary" @click="selectView('ai-conversations')">对话历史</button><button class="btn btn-secondary" @click="selectView('ai-prompts')">提示词模板</button><button class="btn btn-secondary" @click="selectView('ai-artifacts')">AI 产物</button><button class="btn btn-secondary" @click="editInstruction">编辑全局指令</button></div></div>
          <div class="terminal-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">ai.overview</span></div><div class="panel-content"><p class="muted">所有 AI 资产集中在网关，git 版本化。技能在"技能"页，全局指令在知识库 global 项目，其余在此管理。</p></div></div>
        </section>

        <section v-else-if="view === 'ai-conversations'" class="view-stack">
          <div class="toolbar"><input class="ai-search" v-model="aiSearch" placeholder="按标题/摘要搜索..." /><select class="pager-select" v-model="convProjectFilter"><option value="">全部项目</option><option v-for="proj in convProjects" :key="proj" :value="proj">{{ proj }}</option></select><label class="check-option junk-toggle"><input type="checkbox" v-model="convOnlyJunk" />仅看无用（无标题/摘要）</label><div class="toolbar-actions"><button class="btn btn-secondary" :disabled="!convSelected.length" @click="deleteSelectedConversations">删除选中 ({{ convSelected.length }})</button><button class="btn btn-secondary" @click="selectAllFiltered">全选当前</button><button class="btn btn-secondary" @click="clearSelection">取消</button><button class="btn btn-secondary" @click="selectView('ai')">返回</button></div></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">conversations.list</span></div><div class="table-wrap"><table><thead><tr><th>选</th><th>时间</th><th>项目</th><th>标题</th><th>摘要</th><th>操作</th></tr></thead><tbody><tr v-for="c in filteredConversations" :key="c.id"><td><input type="checkbox" :checked="convSelected.includes(c.id)" @change="toggleConvSelect(c.id)" /></td><td>{{ formatDate(c.ts) }}</td><td><span class="tag">{{ c.project || '-' }}</span></td><td>{{ c.title || '-' }}</td><td class="conv-summary">{{ c.summary || '-' }}</td><td><button class="btn btn-secondary btn-sm" @click="toggleConvDetail(c)">详情</button><button class="btn btn-danger btn-sm" @click="deleteConversation(c.id)">删除</button></td></tr><tr v-if="!filteredConversations.length"><td colspan="6" class="empty">暂无对话历史</td></tr></tbody></table></div></div>
          <div v-if="convDetail" class="modal-overlay" @click.self="closeConvDetail"><div class="terminal-panel conv-modal"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">conversation.detail</span><button class="btn btn-ghost btn-icon conv-close" @click="closeConvDetail" title="关闭">×</button></div><div class="panel-content"><h2>{{ convDetail.title }}</h2><p class="muted">{{ convDetail.project }} · {{ formatDate(convDetail.ts) }}<template v-if="convDetail.status"><span class="tag">{{ convDetail.status }}</span></template></p><template v-if="convDetail.summary"><p class="muted">摘要</p><p>{{ convDetail.summary }}</p></template><template v-if="convDetail.outcome"><p class="muted">结论 / 成果</p><p>{{ convDetail.outcome }}</p></template><template v-if="convDetail.decisions?.length"><p class="muted">关键决策</p><p v-for="(d, i) in convDetail.decisions" :key="i">• {{ d }}</p></template><template v-if="convDetail.problems?.length"><p class="muted">踩坑与解法</p><p v-for="(pp, i) in convDetail.problems" :key="i">• {{ pp }}</p></template><template v-if="convDetail.next_steps?.length"><p class="muted">下一步</p><p v-for="(n, i) in convDetail.next_steps" :key="i">• {{ n }}</p></template><template v-if="convDetail.files?.length"><p class="muted">涉及文件</p><p><span v-for="f in convDetail.files" :key="f" class="tag">{{ f.split("/").pop() }}</span></p></template><template v-if="convDetail.skills?.length"><p class="muted">技能</p><p><span v-for="sk in convDetail.skills" :key="sk" class="tag">{{ sk }}</span></p></template></div></div></div>
        </section>

        <section v-else-if="view === 'ai-prompts'" class="view-stack">
          <div class="toolbar"><p class="muted">可复用的提示词模板，AI 会话按需读取。</p><div class="toolbar-actions"><button class="btn btn-primary" @click="newPrompt">新建模板</button><button class="btn btn-secondary" @click="selectView('ai')">返回</button></div></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">prompts.list</span></div><div class="table-wrap"><table><thead><tr><th>路径</th><th>大小</th><th>操作</th></tr></thead><tbody><tr v-for="p in promptFiles" :key="p.path"><td><strong>{{ p.path }}</strong></td><td>{{ p.bytes }} B</td><td><button class="btn btn-secondary btn-sm" @click="editPrompt(p.path)">编辑</button><button class="btn btn-danger btn-sm" @click="deleteAsset('prompts', p.path)">删除</button></td></tr><tr v-if="!promptFiles.length"><td colspan="3" class="empty">暂无提示词模板</td></tr></tbody></table></div></div>
          <div v-if="promptEditing" class="terminal-panel form-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">prompt.editor</span></div><div class="panel-content"><h2>{{ promptDraft.path || '新建模板' }}</h2><label for="prompt-path">路径（.md）</label><input id="prompt-path" v-model="promptDraft.path" placeholder="deploy-checklist.md" /><label for="prompt-content">内容</label><textarea id="prompt-content" v-model="promptDraft.content" rows="12"></textarea><div class="actions"><button class="btn btn-primary" @click="savePrompt">保存</button></div></div></div>
        </section>

        <section v-else-if="view === 'ai-artifacts'" class="view-stack">
          <div class="toolbar"><p class="muted">AI 生成的产物（报告/文档/图表），git 版本化。</p><div class="toolbar-actions"><button class="btn btn-primary" @click="newArtifact">新建产物</button><button class="btn btn-secondary" @click="selectView('ai')">返回</button></div></div>
          <div class="terminal-panel table-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">artifacts.list</span></div><div class="table-wrap"><table><thead><tr><th>路径</th><th>大小</th><th>操作</th></tr></thead><tbody><tr v-for="a in artifactFiles" :key="a.path"><td><strong>{{ a.path }}</strong></td><td>{{ a.bytes }} B</td><td><button class="btn btn-secondary btn-sm" @click="editArtifact(a.path)">查看</button><button class="btn btn-danger btn-sm" @click="deleteAsset('artifacts', a.path)">删除</button></td></tr><tr v-if="!artifactFiles.length"><td colspan="3" class="empty">暂无 AI 产物</td></tr></tbody></table></div></div>
          <div v-if="artifactEditing" class="terminal-panel form-panel"><div class="panel-bar"><span class="panel-dot dot-cyan"></span><span class="panel-dot dot-cyan dim"></span><span class="panel-title">artifact.editor</span></div><div class="panel-content"><h2>{{ artifactDraft.path || '新建产物' }}</h2><label for="artifact-path">路径</label><input id="artifact-path" v-model="artifactDraft.path" placeholder="report-2026-08.md" /><label for="artifact-content">内容</label><textarea id="artifact-content" v-model="artifactDraft.content" rows="16"></textarea><div class="actions"><button class="btn btn-primary" @click="saveArtifact">保存</button></div></div></div>
        </section>
      </section>
    </main>

    <SiteFooter command="mcp-gateway status --authorized" />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import ThemeSwitcher from '../common/ThemeSwitcher.vue'
import SiteFooter from '../common/SiteFooter.vue'
import { getToken } from '../../stores/auth.js'

const router = useRouter()
const user = ref(null)
const token = ref('')
const busy = ref(false)
const error = ref('')
const statusMessage = ref('')
const statusError = ref(false)
const view = ref('overview')
const reindexing = ref(false)
const projects = ref([])
const targets = ref([])
const documents = ref([])
const skills = ref([])
const skillDraft = reactive({ project: '', id: '', content: '' })
const importOpen = ref(false)
const importing = ref(false)
const importMultiple = ref([])
const importDraft = reactive({ url: '', project: 'global' })
const auditSize = ref(50)
const auditRows = ref([])
const auditPage = ref(1)
const auditTotal = ref(0)
const auditPages = ref(1)
const users = ref([])
const conversations = ref([])
const convProjectFilter = ref('')
const convOnlyJunk = ref(false)
const convSelected = ref([])
const promptFiles = ref([])
const artifactFiles = ref([])
const aiSearch = ref('')
const convDetail = ref(null)
const promptEditing = ref(false)
const promptDraft = reactive({ path: '', content: '' })
const artifactEditing = ref(false)
const artifactDraft = reactive({ path: '', content: '' })
const projectId = ref('')
const documentPath = ref('')
const newToken = ref('')
const documentDraft = reactive({ path: 'notes.md', content: '' })
const targetDraft = reactive({ id: '', label: '', host: '', port: 22, user: '', project: '', auth_method: 'private_key', private_key: '', password: '', known_hosts: '' })
const editingTargetId = ref('')
const editingUserId = ref('')
const userDraft = reactive({ display_name: '', role: 'operator', allowed_projects: [], allowed_targets: [] })

const navItems = [
  { id: 'overview', num: '01', label: '概览' },
  { id: 'projects', num: '02', label: '知识库' },
  { id: 'skills', num: '03', label: '技能' },
  { id: 'targets', num: '04', label: 'SSH 服务器' },
  { id: 'audit', num: '05', label: '审计日志' },
  { id: 'users', num: '06', label: '用户与 Token' },
  { id: 'ai', num: '07', label: 'AI 资产' },
]
  const currentTitle = computed(() => ({ overview: '概览', projects: '知识库', project: projectId.value, document: '文档编辑器', skills: '技能', skill: '技能编辑器', targets: 'SSH 服务器', 'target-form': editingTargetId.value ? '编辑 SSH 服务器' : '添加 SSH 服务器', audit: '审计日志', users: '用户与 Token', ai: 'AI 资产', 'ai-conversations': '对话历史', 'ai-prompts': '提示词', 'ai-artifacts': 'AI 产物' })[view.value] || 'Gateway')

const api = async (path, options = {}) => {
  // Always send gateway API calls through the /api/gateway prefix so the blog
  // edge Caddy can proxy them to the knowledge-base backend (and the Vite dev
  // proxy can reach the gateway locally). Idempotent for already-prefixed paths.
  const gatewayPath = path.startsWith('/api/gateway')
    ? path
    : path.replace(/^\/api(?=\/|$)/, '/api/gateway')
  const response = await fetch(gatewayPath, { credentials: 'include', headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`)
  return body
}

function setStatus(message = '', isError = false) { statusMessage.value = message; statusError.value = isError }
function formatDate(value) { return value ? new Date(value).toLocaleString() : '-' }
async function loadResources() { [projects.value, targets.value, skills.value] = await Promise.all([api('/api/projects'), api('/api/targets'), api('/api/skills')]) }
async function login() {
  error.value = ''; busy.value = true
  try { user.value = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ token: token.value }) }); token.value = ''; await selectView('overview') }
  catch (cause) { error.value = cause.message }
  finally { busy.value = false }
}
async function restoreSession() {
  try { user.value = await api('/api/me'); await selectView('overview'); return } catch {}
  // SSO（账号打通）：博客已登录则用博客 JWT 自动登录网关；失败提示改用下方 Token 登录。
  const blogJwt = getToken()
  if (blogJwt) {
    try { user.value = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ token: blogJwt }) }); await selectView('overview') }
    catch (cause) { error.value = '博客账号未开通网关权限或登录已过期，可改用下方 Token 登录' }
  }
}
async function logout() { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); user.value = null; router.push('/HomePage') }
async function selectView(next) {
  view.value = next; setStatus(''); newToken.value = ''
  try {
    if (next === 'overview') await loadResources()
    if (next === 'projects') await loadResources()
    if (next === 'skills') await loadSkills()
    if (next === 'targets') await loadResources()
    if (next === 'audit') await loadAudit(1)
    if (next === 'ai') await loadAiData()
    if (next === 'ai-conversations') { await loadAiData(); aiSearch.value = '' }
    if (next === 'ai-prompts') await loadAiData()
    if (next === 'ai-artifacts') await loadAiData()
    if (next === 'users') { await loadResources(); users.value = await api('/api/users') }
  } catch (cause) { setStatus(cause.message, true) }
}
async function createProject() { const id = window.prompt('项目 ID（仅字母、数字、下划线和短横线）'); if (!id) return; try { await api('/api/projects', { method: 'POST', body: JSON.stringify({ id }) }); await selectView('projects') } catch (cause) { setStatus(cause.message, true) } }
async function reindexAll() {
  if (!window.confirm('全量重建索引？会扫描 knowledge/ 全部文档并重新切片 + 生成向量，可能耗时几分钟。')) return
  reindexing.value = true
  setStatus('正在重建索引...')
  try {
    const result = await api('/api/reindex', { method: 'POST' })
    setStatus(`重建完成：${result.files ?? '?'} 文件 / ${result.chunks ?? '?'} 分片 / ${result.embedding_errors ?? '?'} embedding 错误`)
  } catch (cause) { setStatus(cause.message, true) }
  finally { reindexing.value = false }
}
async function deleteProject(id) { if (!window.confirm(`删除项目 ${id} 及其文档？`)) return; try { await api(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }); await selectView('projects') } catch (cause) { setStatus(cause.message, true) } }
async function openProject(id) { projectId.value = id; try { documents.value = await api(`/api/projects/${encodeURIComponent(id)}/documents`); view.value = 'project' } catch (cause) { setStatus(cause.message, true) } }
async function readDocument(path) { try { const doc = await api(`/api/projects/${encodeURIComponent(projectId.value)}/documents/${encodeURIComponent(path)}`); editDocument(projectId.value, doc.path, doc.content) } catch (cause) { setStatus(cause.message, true) } }
function editDocument(project, path, content) { projectId.value = project; documentPath.value = path; documentDraft.path = path || 'notes.md'; documentDraft.content = content || ''; view.value = 'document' }
async function saveDocument() { const path = documentPath.value || documentDraft.path; if (!path) return setStatus('文档路径不能为空', true); try { await api(`/api/projects/${encodeURIComponent(projectId.value)}/documents`, { method: 'POST', body: JSON.stringify({ path, content: documentDraft.content }) }); await openProject(projectId.value) } catch (cause) { setStatus(cause.message, true) } }
async function deleteDocument(path) { if (!window.confirm(`删除 ${path}？`)) return; try { await api(`/api/projects/${encodeURIComponent(projectId.value)}/documents/${encodeURIComponent(path)}`, { method: 'DELETE' }); await openProject(projectId.value) } catch (cause) { setStatus(cause.message, true) } }
async function loadSkills() { skills.value = await api('/api/skills') }
async function readSkill(project, skillId) { try { const skill = await api(`/api/skills/${encodeURIComponent(project)}/${encodeURIComponent(skillId)}`); editSkill(project, skillId, skill.content) } catch (cause) { setStatus(cause.message, true) } }
async function newSkill() { try { await loadResources(); skillDraft.project = projects.value[0]?.id ?? ''; skillDraft.id = ''; skillDraft.content = ''; view.value = 'skill' } catch (cause) { setStatus(cause.message, true) } }
function editSkill(project, skillId, content) { skillDraft.project = project; skillDraft.id = skillId; skillDraft.content = content || ''; view.value = 'skill' }
async function saveSkill() { const project = skillDraft.project; const skillId = skillDraft.id.trim(); if (!project || !skillId) return setStatus('项目与技能 ID 不能为空', true); if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(skillId)) return setStatus('技能 ID 仅限字母数字下划线短横线', true); const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(skillDraft.content); if (!fm || !/^\s*name\s*:/m.test(fm[1])) return setStatus('frontmatter 缺少 name 字段（SKILL.md 需以 --- 开头声明 name）', true); try { await api(`/api/skills/${encodeURIComponent(project)}/${encodeURIComponent(skillId)}`, { method: 'POST', body: JSON.stringify({ content: skillDraft.content }) }); setStatus('技能已保存'); await selectView('skills') } catch (cause) { setStatus(cause.message, true) } }
async function deleteSkill(project, skillId) { if (!window.confirm(`删除技能 ${project}/${skillId}？`)) return; try { await api(`/api/skills/${encodeURIComponent(project)}/${encodeURIComponent(skillId)}`, { method: 'DELETE' }); setStatus('技能已删除'); await selectView('skills') } catch (cause) { setStatus(cause.message, true) } }
async function loadAudit(page = 1, pageSize) { try { const result = await api(`/api/audit?limit=${pageSize ?? auditSize.value}&page=${page}`); auditRows.value = result.rows ?? result; auditPage.value = result.page ?? page; auditTotal.value = result.total ?? auditRows.value.length; auditPages.value = result.pages ?? 1 } catch (cause) { setStatus(cause.message, true) } }
function toggleImport() { importOpen.value = !importOpen.value; importMultiple.value = [] }
function closeImport() { importOpen.value = false; importMultiple.value = []; importDraft.url = '' }
async function doImport(url, project, path) { if (!url) return setStatus('请输入 GitHub 链接', true); importing.value = true; setStatus(''); try { const result = await api('/api/skills/import', { method: 'POST', body: JSON.stringify({ project, url, path }) }); if (result.multiple?.length) { importMultiple.value = result.multiple; setStatus(`仓库中有 ${result.multiple.length} 个 skill，点选导入`); return; } importMultiple.value = []; importOpen.value = false; setStatus(`已导入 ${result.id}（${result.name}）`); await selectView('skills') } catch (cause) { setStatus(cause.message, true) } finally { importing.value = false } }


function newTarget() { editingTargetId.value = ''; Object.assign(targetDraft, { id: '', label: '', host: '', port: 22, user: '', project: '', auth_method: 'private_key', private_key: '', password: '', known_hosts: '' }); view.value = 'target-form' }
function editTarget(item) { editingTargetId.value = item.id; Object.assign(targetDraft, { id: item.id, label: item.label, host: item.host, port: item.port, user: item.user, project: item.project || '', auth_method: item.auth_method || 'private_key', private_key: '', password: '', known_hosts: '' }); view.value = 'target-form' }
async function loadPrivateKeyFile(event) { const file = event.target.files?.[0]; if (!file) return; try { targetDraft.private_key = await file.text() } catch (cause) { setStatus(cause.message, true) } }
async function saveTarget() { try { const editing = Boolean(editingTargetId.value); const body = { ...targetDraft, port: Number(targetDraft.port) }; if (body.auth_method === 'private_key') { delete body.password; if (editing && !body.private_key.trim()) delete body.private_key } else { delete body.private_key; if (editing && !body.password.trim()) delete body.password } if (editing && !body.known_hosts.trim()) delete body.known_hosts; const endpoint = editing ? `/api/targets/${encodeURIComponent(editingTargetId.value)}` : '/api/targets'; await api(endpoint, { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(body) }); editingTargetId.value = ''; await selectView('targets') } catch (cause) { setStatus(cause.message, true) } }
async function testTarget(id) { setStatus(`正在测试 ${id}...`); try { const result = await api(`/api/targets/${encodeURIComponent(id)}/test`, { method: 'POST' }); setStatus(result.code === 0 ? `${id} 连接成功` : `${id} 返回代码 ${result.code}`, result.code !== 0) } catch (cause) { setStatus(cause.message, true) } }
async function deleteTarget(id) { if (!window.confirm(`删除服务器 ${id}？`)) return; try { await api(`/api/targets/${encodeURIComponent(id)}`, { method: 'DELETE' }); await selectView('targets') } catch (cause) { setStatus(cause.message, true) } }
async function createUser() { const id = window.prompt('用户 ID'); if (!id) return; const display_name = window.prompt('显示名称', id) || id; try { const result = await api('/api/users', { method: 'POST', body: JSON.stringify({ id, display_name, role: 'operator' }) }); users.value = await api('/api/users'); newToken.value = result.token; view.value = 'users' } catch (cause) { setStatus(cause.message, true) } }
function editUser(item) { editingUserId.value = item.id; userDraft.display_name = item.display_name; userDraft.role = item.role; userDraft.allowed_projects = [...item.allowed_projects]; userDraft.allowed_targets = [...item.allowed_targets]; setStatus('') }
function cancelEditUser() { editingUserId.value = ''; userDraft.display_name = ''; userDraft.role = 'operator'; userDraft.allowed_projects = []; userDraft.allowed_targets = [] }
async function saveUserPermissions() { if (!editingUserId.value) return; try { await api('/api/users/' + encodeURIComponent(editingUserId.value), { method: 'PATCH', body: JSON.stringify({ display_name: userDraft.display_name, role: userDraft.role, allowed_projects: userDraft.allowed_projects, allowed_targets: userDraft.allowed_targets }) }); users.value = await api('/api/users'); if (editingUserId.value === user.value.id) user.value = await api('/api/me'); cancelEditUser(); setStatus('用户权限已更新') } catch (cause) { setStatus(cause.message, true) } }
async function rotateUser(id) { if (!window.confirm(`轮换 ${id} 的 Token？旧 Token 会立即失效。`)) return; try { const result = await api(`/api/users/${encodeURIComponent(id)}/rotate-token`, { method: 'POST' }); newToken.value = result.token; users.value = await api('/api/users') } catch (cause) { setStatus(cause.message, true) } }
async function deleteUser(id) { if (!window.confirm(`删除用户 ${id}？`)) return; try { await api(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' }); users.value = await api('/api/users') } catch (cause) { setStatus(cause.message, true) } }
const filteredConversations = computed(() => {
  const q = aiSearch.value.toLowerCase()
  const proj = convProjectFilter.value
  return conversations.value.filter((c) => {
    if (proj && c.project !== proj) return false
    if (convOnlyJunk.value && (c.title || '').trim() && (c.summary || '').trim()) return false
    if (q && !(c.title || '').toLowerCase().includes(q) && !(c.summary || '').toLowerCase().includes(q)) return false
    return true
  })
})
const convProjects = computed(() => [...new Set(conversations.value.map((c) => c.project).filter(Boolean))].sort())
async function loadAiData() { try { [conversations.value, promptFiles.value, artifactFiles.value] = await Promise.all([api('/api/history/conversations'), api('/api/assets/prompts'), api('/api/assets/artifacts')]) } catch (cause) { setStatus(cause.message, true) } }
async function toggleConvDetail(c) { if (convDetail.value?.id === c.id) return closeConvDetail(); try { convDetail.value = await api(`/api/history/conversations/${encodeURIComponent(c.id)}`) } catch (cause) { setStatus(cause.message, true) } }
function closeConvDetail() { convDetail.value = null }
async function deleteConversation(id) { if (!window.confirm(`删除对话 ${id}？`)) return; try { await api(`/api/history/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }); convDetail.value = null; await loadAiData(); setStatus('已删除') } catch (cause) { setStatus(cause.message, true) } }
function toggleConvSelect(id) { const i = convSelected.value.indexOf(id); if (i >= 0) convSelected.value.splice(i, 1); else convSelected.value.push(id) }
function selectAllFiltered() { convSelected.value = filteredConversations.value.map((c) => c.id) }
function clearSelection() { convSelected.value = [] }
async function deleteSelectedConversations() { if (!convSelected.value.length) return setStatus('未选择对话', true); if (!window.confirm(`删除选中的 ${convSelected.value.length} 条对话？`)) return; try { const results = await Promise.allSettled(convSelected.value.map((id) => api(`/api/history/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' }))); const ok = results.filter((r) => r.status === 'fulfilled').length; convSelected.value = []; convDetail.value = null; setStatus(`已删除 ${ok} 条`); await loadAiData() } catch (cause) { setStatus(cause.message, true) } }
function newPrompt() { promptEditing.value = true; promptDraft.path = ''; promptDraft.content = '' }
function editPrompt(p) { promptEditing.value = true; readAsset('prompts', p) }
function newArtifact() { artifactEditing.value = true; artifactDraft.path = ''; artifactDraft.content = '' }
function editArtifact(p) { artifactEditing.value = true; readAsset('artifacts', p) }
async function readAsset(area, p) { try { const a = await api(`/api/assets/${area}/${encodeURIComponent(p)}`); if (area === 'prompts') { promptDraft.path = a.path; promptDraft.content = a.content } else { artifactDraft.path = a.path; artifactDraft.content = a.content } } catch (cause) { setStatus(cause.message, true) } }
async function savePrompt() { const p = promptDraft.path.trim(); if (!p) return setStatus('路径不能为空', true); try { await api(`/api/assets/prompts/${encodeURIComponent(p)}`, { method: 'POST', body: JSON.stringify({ content: promptDraft.content }) }); promptEditing.value = false; setStatus('已保存'); await loadAiData() } catch (cause) { setStatus(cause.message, true) } }
async function saveArtifact() { const p = artifactDraft.path.trim(); if (!p) return setStatus('路径不能为空', true); try { await api(`/api/assets/artifacts/${encodeURIComponent(p)}`, { method: 'POST', body: JSON.stringify({ content: artifactDraft.content }) }); artifactEditing.value = false; setStatus('已保存'); await loadAiData() } catch (cause) { setStatus(cause.message, true) } }
async function deleteAsset(area, p) { if (!window.confirm(`删除 ${area}/${p}？`)) return; try { await api(`/api/assets/${area}/${encodeURIComponent(p)}`, { method: 'DELETE' }); setStatus('已删除'); await loadAiData() } catch (cause) { setStatus(cause.message, true) } }
async function editInstruction() { try { const doc = await api('/api/projects/global/documents/instructions.md'); editDocument('global', doc.path, doc.content) } catch (cause) { setStatus(cause.message, true) } }

onMounted(restoreSession)
</script>

<style scoped>
.gateway-page { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; position: relative; overflow-x: hidden; }
.bg-grid { position: fixed; inset: 0; background-image: linear-gradient(var(--overlay-a15) 1px, transparent 1px), linear-gradient(90deg, var(--overlay-a15) 1px, transparent 1px); background-size: 64px 64px; pointer-events: none; z-index: 0; }
.bg-scanline { position: fixed; inset: 0; background: repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline) 2px, var(--scanline) 4px); pointer-events: none; z-index: 0; animation: gateway-scan 8s linear infinite; }
@keyframes gateway-scan { from { transform: translateY(0); } to { transform: translateY(4px); } }
.navbar { position: sticky; top: 0; z-index: 100; background: var(--navbar-bg); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
.navbar-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 14px; font-weight: 600; white-space: nowrap; }
.brand-bracket { color: var(--text-muted); }.brand-text { color: var(--accent); }.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }
.nav-actions { display: flex; align-items: center; gap: 12px; }.gateway-badge { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: var(--warn); padding: 4px 10px; background: var(--warn-a8); border: 1px solid var(--warn-a20); border-radius: 4px; }.nav-link { font-size: 12px; color: var(--text-dim); text-decoration: none; }.nav-link:hover { color: var(--accent); }
.login-layout { min-height: calc(100vh - 56px); display: grid; place-items: center; padding: 32px 24px; position: relative; z-index: 1; }.login-panel { width: min(460px, 100%); }
.main-layout { max-width: 1200px; margin: 0 auto; padding: 40px 24px; display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 40px; position: relative; z-index: 1; }
.sidebar { display: flex; flex-direction: column; gap: 16px; }.sidebar-panel, .terminal-panel { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }.panel-bar { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--overlay-a15); border-bottom: 1px solid var(--border); }.panel-dot { width: 8px; height: 8px; border-radius: 50%; }.dot-cyan { background: var(--accent); }.dot-green { background: var(--ok); }.dim { opacity: .3; }.panel-title { flex: 1; font-size: 10px; font-weight: 600; color: var(--text-muted); text-align: center; letter-spacing: 1.5px; text-transform: lowercase; }.panel-body { padding: 8px 0; }.panel-content { padding: 24px; }.nav-body { padding: 4px 0; }
.nav-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 16px; font: inherit; font-size: 12px; font-weight: 500; color: var(--text-dim); text-align: left; background: none; border: 0; border-left: 2px solid transparent; cursor: pointer; }.nav-item:hover { color: var(--text); background: var(--overlay-a2); }.nav-item.active { color: var(--accent); border-left-color: var(--accent); background: var(--accent-a4); }.nav-num { color: var(--text-faint); font-size: 10px; font-weight: 700; min-width: 18px; }.nav-item.active .nav-num { color: var(--accent); }
.info-line { display: flex; justify-content: space-between; gap: 12px; padding: 5px 12px; font-size: 11px; }.info-key { color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }.info-val { color: var(--text-secondary); overflow-wrap: anywhere; }.terminal-green, .status-ok { color: var(--ok); }.logout-button { padding: 10px 12px; font: inherit; font-size: 12px; color: var(--text-dim); background: none; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; }.logout-button:hover { color: var(--err); border-color: var(--err); }
.content { min-width: 0; }.content-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 28px; }.content-heading h1, .login-panel h1 { margin: 0; color: var(--text-bright); font-size: clamp(24px, 4vw, 34px); }.eyebrow { margin: 0 0 8px; color: var(--accent); font-size: 10px; letter-spacing: 1.5px; }.muted { color: var(--text-dim); }.error, .status-error { color: var(--err); }.status { min-height: 18px; font-size: 12px; color: var(--ok); text-align: right; }.view-stack { display: grid; gap: 16px; }.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }.metric-card { display: flex; flex-direction: column; gap: 10px; padding: 18px; }.metric-label { color: var(--text-dim); font-size: 11px; }.metric-card strong { color: var(--accent); font-size: 30px; line-height: 1; }.metric-card .role-value { font-size: 18px; text-transform: uppercase; }.metric-code { color: var(--text-muted); font-size: 10px; }.status-line { margin-top: 18px; color: var(--ok); font-size: 12px; }.status-dot { width: 7px; height: 7px; display: inline-block; margin-right: 6px; background: var(--ok); border-radius: 50%; box-shadow: 0 0 10px var(--ok); }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }.toolbar p { margin: 0; font-size: 12px; }.toolbar-actions { display: flex; gap: 8px; }.pager-info { align-self: center; font-size: 12px; color: var(--text-dim); } .pager-select { padding: 5px 8px; font: inherit; font-size: 12px; color: var(--text); background: var(--bg-code); border: 1px solid var(--border-strong); border-radius: 5px; }.import-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; } .ai-search { padding: 8px 10px; font: inherit; font-size: 12px; color: var(--text); background: var(--bg-code); border: 1px solid var(--border-strong); border-radius: 6px; min-width: 240px; }.conv-summary { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .junk-toggle { display: inline-flex; align-items: center; gap: 6px; padding: 8px 10px; font-size: 12px; color: var(--text-secondary); }.btn-sm { margin-right: 6px; }.full-width { margin-top: 18px; }.table-panel { overflow: hidden; }.table-wrap { overflow-x: auto; }.table-wrap table { width: 100%; min-width: 680px; border-collapse: collapse; font-size: 12px; }.table-wrap th, .table-wrap td { padding: 12px 14px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); }.table-wrap th { color: var(--text-muted); background: var(--overlay-a15); font-weight: 600; }.table-wrap tr:last-child td { border-bottom: 0; }.empty { padding: 24px !important; color: var(--text-dim); text-align: center !important; }.tag { display: inline-block; margin-top: 4px; padding: 3px 7px; color: var(--text-dim); border: 1px solid var(--border-strong); border-radius: 4px; font-size: 10px; }.form-panel label, .login-panel label { display: block; margin: 14px 0 6px; color: var(--text-secondary); font-size: 12px; }.form-panel input, .form-panel textarea, .login-panel input { width: 100%; box-sizing: border-box; padding: 10px 12px; color: var(--text); font: inherit; font-size: 12px; background: var(--bg-code); border: 1px solid var(--border-strong); border-radius: 6px; outline: none; }.form-panel input:focus, .form-panel textarea:focus, .login-panel input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-a8); }.form-panel textarea { min-height: 150px; resize: vertical; }.form-panel select { width: 100%; box-sizing: border-box; padding: 10px 12px; color: var(--text); font: inherit; font-size: 12px; background: var(--bg-code); border: 1px solid var(--border-strong); border-radius: 6px; }.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 16px; }.actions { display: flex; gap: 8px; margin-top: 18px; }.token-notice { display: grid; gap: 10px; padding: 16px; color: var(--warn); background: var(--warn-a8); border: 1px solid var(--warn-a20); border-radius: 6px; font-size: 12px; }.token-notice code { color: var(--text-bright); overflow-wrap: anywhere; white-space: pre-wrap; }
@media (max-width: 800px) { .main-layout { grid-template-columns: 1fr; gap: 24px; padding: 28px 16px; }.sidebar { flex-direction: row; flex-wrap: wrap; }.sidebar-panel { flex: 1; min-width: 220px; }.logout-button { width: 100%; }.metric-grid, .form-grid { grid-template-columns: 1fr; }.content-heading { align-items: start; flex-direction: column; }.status { text-align: left; }.gateway-badge { display: none; }.navbar-inner { padding: 0 16px; }.brand-path { display: none; }.login-layout { padding: 24px 16px; } }
 .access-section { margin-top: 20px; }.access-section h3 { margin: 0 0 10px; color: var(--text-bright); font-size: 13px; }.access-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }.check-option { display: flex !important; align-items: center; gap: 8px; margin: 0 !important; padding: 9px 10px; color: var(--text-secondary); background: var(--overlay-a4); border: 1px solid var(--border); border-radius: 5px; cursor: pointer; }.check-option input { width: auto !important; accent-color: var(--accent); }.content-heading.compact { margin-bottom: 8px; align-items: center; }.user-permission-panel select { width: 100%; box-sizing: border-box; padding: 10px 12px; color: var(--text); font: inherit; font-size: 12px; background: var(--bg-code); border: 1px solid var(--border-strong); border-radius: 6px; }
.form-panel select { width: 100%; box-sizing: border-box; padding: 10px 12px; color: var(--text); font: inherit; font-size: 12px; background: var(--bg-code); border: 1px solid var(--border-strong); border-radius: 6px; outline: none; }.form-panel select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-a8); }


/* conversation detail modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--modal-overlay); }
.conv-modal { width: min(760px, 100%); max-height: 84vh; display: flex; flex-direction: column; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.conv-modal .panel-content { flex: 1; min-height: 0; overflow: auto; }
.conv-close { flex: none; font-size: 16px; line-height: 1; }
</style>