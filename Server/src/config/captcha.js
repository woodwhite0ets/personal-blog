const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');

// ====== 内存验证码存储（单进程 PM2 fork 模式） ======
// 生产为单实例，内存 Map 足够；多实例集群时需换 Redis
const store = new Map();
const TTL_MS = 5 * 60 * 1000; // 5 分钟过期

// 清理过期验证码（每次生成时顺带清理，防止内存增长）
function sweepExpired() {
  const now = Date.now();
  for (const [id, entry] of store) {
    if (now > entry.expires) store.delete(id);
  }
}

// ====== 生成验证码：返回 id + SVG ======
function createCaptcha() {
  sweepExpired();
  const id = crypto.randomBytes(16).toString('hex');
  // 去除易混淆字符 0/O 1/I/L，全部大写，校验时忽略大小写
  const c = svgCaptcha.create({
    size: 4,
    noise: 3,
    color: true,
    background: '#0f1220',
    charPreset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  });
  store.set(id, { text: c.text.toLowerCase(), expires: Date.now() + TTL_MS });
  // 内存上限保护：超过 1000 个时驱逐最旧的
  if (store.size > 1000) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
  return { id, svg: c.data };
}

// ====== 校验验证码（一次性：无论对错都删除，防重放） ======
function verifyCaptcha(id, text) {
  if (!id || typeof id !== 'string') return false;
  const entry = store.get(id);
  if (!entry) return false;
  store.delete(id); // 一次性使用
  if (Date.now() > entry.expires) return false;
  return entry.text === String(text || '').toLowerCase().trim();
}

module.exports = { createCaptcha, verifyCaptcha };
