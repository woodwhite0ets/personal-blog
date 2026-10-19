// 输入清理工具（防 XSS & 长度限制）
// 从 routes/posts.js 抽出以便单元测试。

function sanitizeText(val, maxLen = 500) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // 去除控制字符（保留 \n \t）
    .replace(/<[^>]*>/g, '')       // 去除 HTML 标签
    .replace(/[<>]/g, '')          // 去除残留尖括号
    .replace(/&#(?:x[0-9a-fA-F]{1,6}|[0-9]{1,7});/gi, '')   // 剥离数字字符引用（防实体混淆）
    .slice(0, maxLen)
    .trim();
}

function sanitizeContent(val) {
  if (typeof val !== 'string') return val;
  // 去除 null 字节和控制字符（保留换行和制表符）
  return val
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // 剥离数字字符引用（&#61; / &#x61;），防实体混淆的 XSS（如 jav&#x61;script:、<scr&#105;pt>）
    .replace(/&#(?:x[0-9a-fA-F]{1,6}|[0-9]{1,7});/gi, '')
    // 剥离危险标签（防存储型 XSS）
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>|<embed[\s\S]*?<\/embed>/gi, '')
    // 剥离事件处理器属性（onerror/onload/onclick 等）防 XSS
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // 剥离 javascript:/data: 危险协议
    .replace(/(javascript|vbscript)\s*:/gi, 'blocked:')
    // 剥离 base64 data URI（防存入数据库）
    .replace(/!\[([^\]]*)\]\(data:[^)]+\)/g, '![$1](uploading...)')
    // 剥离 data: 协议链接（图片内嵌 data URI 已在上方保留）
    .replace(/\[([^\]]*)\]\(data:[^)]*\)/g, '[$1](blocked:)')
    .slice(0, 200000); // 200KB max
}

function sanitizeTag(val) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/[\\/:*?"|]/g, '')
    .slice(0, 30)
    .trim();
}

function validateCoverImage(url) {
  if (!url || url === '') return true; // null/空字符串允许
  if (typeof url !== 'string') return false;
  if (url.length > 500) return false;
  // 清理路径遍历符号
  url = url.replace(/\.\./g, '').replace(/\\/g, '/');
  // 只允许本地 /uploads/ 路径或相对路径
  return url.startsWith('/uploads/');
}

// 密码强度校验（注册 / 改密 / 重置共用）
// 密码规则单一来源：各处校验引用常量，错误文案仍由调用方决定
// （register / change-password / reset-password 三处消息不同，不应强行统一）
const PASSWORD_RULES = {
  min: 8,
  max: 128,
  pattern: /(?=.*[a-zA-Z])(?=.*\d)/,
};

function validatePassword(password) {
  if (typeof password !== 'string') return 'password is required';
  if (password.length < PASSWORD_RULES.min) return 'password must be at least 8 characters';
  if (!PASSWORD_RULES.pattern.test(password)) return 'password must contain both letters and numbers';
  if (password.length > PASSWORD_RULES.max) return 'password too long';
  return null; // 通过
}

const RESERVED_USERNAMES = ['admin', 'administrator', 'root', 'sysadmin', 'superuser', 'superadmin', 'system'];

// 用户名格式 + 保留名校验
function validateUsername(username) {
  if (typeof username !== 'string') return 'all fields are required';
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return 'username: 3-20 chars, letters/numbers/underscore only';
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) return 'this username is reserved and cannot be used';
  return null;
}

module.exports = {
  PASSWORD_RULES,
  sanitizeText,
  sanitizeContent,
  sanitizeTag,
  validateCoverImage,
  validatePassword,
  validateUsername,
  RESERVED_USERNAMES,
};
