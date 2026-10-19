const express = require('express');
const https = require('https');
const pool = require('../config/db');
const { authRequired, authAdmin } = require('../middleware/auth');

const router = express.Router();

// ====== 网关权限面板（账号打通） ======
// 博客 /admin 经此代理调用网关管理 API（/api/gateway/* 的直连等价路径），
// 用专用服务账号 GW_ADMIN_TOKEN 认证，避免把博客管理员的 JWT 当网关凭证。

const GW_ADMIN_TOKEN = process.env.GW_ADMIN_TOKEN;
const GW_BASE = process.env.GW_TUNNEL_BASE || 'https://127.0.0.1:18081';
const GW_HOST = process.env.GW_TUNNEL_HOST || 'mcp.woodwhite.top';
// 仅回环反向 SSH 隧道：跳过 TLS 校验 + Host 钉死 + Bearer 三重防护。
// rejectUnauthorized:false 的安全性完全依赖 GW_TUNNEL_BASE 指向回环，
// 因此启动即断言，避免将来被误配成非回环地址而变成可 MITM。
const LOOPBACK = /^https:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/;
if (!LOOPBACK.test(GW_BASE)) {
  throw new Error(
    `GW_TUNNEL_BASE 必须指向回环地址（当前 ${GW_BASE}）：该代理关闭了 TLS 校验，仅可用于回环隧道。`
  );
}
const tunnelAgent = new https.Agent({ rejectUnauthorized: false });

function gw(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    if (!GW_ADMIN_TOKEN) {
      const err = new Error('网关服务账号未配置（GW_ADMIN_TOKEN）');
      err.statusCode = 503;
      return reject(err);
    }
    const url = new URL(GW_BASE + path);
    const payload = body === undefined ? null : JSON.stringify(body);
    const req = https.request(url, {
      method,
      agent: tunnelAgent,
      headers: {
        Host: GW_HOST,
        Authorization: `Bearer ${GW_ADMIN_TOKEN}`,
        'content-type': 'application/json',
        ...(payload ? { 'content-length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let json = {};
        try { json = data ? JSON.parse(data) : {}; } catch { /* 非 JSON */ }
        if (res.statusCode >= 400) {
          const err = new Error(json.error || `网关返回 ${res.statusCode}`);
          err.statusCode = res.statusCode;
          return reject(err);
        }
        resolve(json);
      });
    });
    req.on('error', (err) => {
      err.statusCode = 502;
      reject(err);
    });
    if (payload) req.write(payload);
    req.end();
  });
}

router.use(authRequired, authAdmin);

// ====== GET /users — 网关用户列表 + 博客用户信息 + 可用项目/服务器 ======
router.get('/users', async (req, res, next) => {
  try {
    const [users, projects, targets] = await Promise.all([
      gw('/api/users'),
      gw('/api/projects'),
      gw('/api/targets'),
    ]);
    const numericIds = users.map((u) => Number(u.id)).filter((n) => Number.isInteger(n) && n > 0);
    let blogById = {};
    if (numericIds.length) {
      const [rows] = await pool.query(
        'SELECT id, username, nickname, email, role, is_verified FROM users WHERE id IN (?)',
        [numericIds]
      );
      for (const row of rows) blogById[String(row.id)] = row;
    }
    res.json({
      users: users.map((u) => ({ ...u, blog: blogById[String(u.id)] || null })),
      projects,
      targets,
    });
  } catch (e) { next(e); }
});

// ====== POST /users — 给博客用户开通网关权限（签发一次性 mcp_ token） ======
router.post('/users', async (req, res, next) => {
  try {
    const body = req.body || {};
    const id = Number(body.blog_user_id);
    if (!Number.isInteger(id) || id <= 0) {
      const err = new Error('blog_user_id 必须是博客用户的数字 id');
      err.statusCode = 400;
      throw err;
    }
    const [rows] = await pool.query('SELECT id, username, nickname FROM users WHERE id = ?', [id]);
    if (!rows.length) {
      const err = new Error('博客用户不存在');
      err.statusCode = 404;
      throw err;
    }
    const blogUser = rows[0];
    const result = await gw('/api/users', {
      method: 'POST',
      body: {
        id: String(id),
        username: blogUser.username,
        display_name: blogUser.nickname || blogUser.username,
        role: body.role === 'admin' ? 'admin' : 'operator',
        allowed_projects: Array.isArray(body.allowed_projects) ? body.allowed_projects : [],
        allowed_targets: Array.isArray(body.allowed_targets) ? body.allowed_targets : [],
        target_permissions: (body.target_permissions && typeof body.target_permissions === 'object') ? body.target_permissions : {},
      },
    });
    res.status(201).json(result); // 含一次性 token，仅此一次
  } catch (e) { next(e); }
});

// ====== PATCH /users/:id — 更新网关权限（role/项目/服务器/display_name） ======
// 允许透传给网关的字段白名单（此前整体透传 req.body，客户端可注入任意属性）
const GATEWAY_PATCH_FIELDS = ['role', 'display_name', 'projects', 'servers'];

router.patch('/users/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const payload = {};
    for (const key of GATEWAY_PATCH_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key];
    }
    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ message: 'no updatable field provided' });
    }
    const result = await gw(`/api/users/${encodeURIComponent(req.params.id)}`, { method: 'PATCH', body: payload });
    res.json(result);
  } catch (e) { next(e); }
});

// ====== POST /users/:id/rotate-token — 轮换 mcp_ token ======
router.post('/users/:id/rotate-token', async (req, res, next) => {
  try {
    const result = await gw(`/api/users/${encodeURIComponent(req.params.id)}/rotate-token`, { method: 'POST' });
    res.json(result); // 含一次性新 token
  } catch (e) { next(e); }
});

// ====== DELETE /users/:id — 移除网关访问 ======
router.delete('/users/:id', async (req, res, next) => {
  try {
    const result = await gw(`/api/users/${encodeURIComponent(req.params.id)}`, { method: 'DELETE' });
    res.json(result);
  } catch (e) { next(e); }
});

// 错误处理：只透出网关的状态码，不透出 err.message
// （err.message 可能包含上游响应片段、隧道地址等内部拓扑信息）
router.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  if (status >= 500) console.error('[gatewayAdmin]', err);
  res.status(status).json({
    error: status >= 500 ? 'gateway unavailable' : err.message,
  });
});

module.exports = router;
