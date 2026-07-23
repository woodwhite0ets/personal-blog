// ====== 内存日志环形缓冲区 ======
// 捕获 console 输出，供管理后台查看

const MAX_LINES = 500;
const buffer = [];

// 拦截 console 方法
const originalLog = console.log.bind(console);
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function push(level, ...args) {
  const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  buffer.push({ ts: timestamp(), level, message });
  if (buffer.length > MAX_LINES) buffer.shift();
}

console.log = (...args) => {
  push('info', ...args);
  originalLog(...args);
};

console.warn = (...args) => {
  push('warn', ...args);
  originalWarn(...args);
};

console.error = (...args) => {
  push('error', ...args);
  originalError(...args);
};

// API: 获取日志
function getLogs(limit = 100, level) {
  let lines = buffer;
  if (level) lines = lines.filter(l => l.level === level);
  return lines.slice(-limit);
}

// 清空（调试用）
function clearLogs() {
  buffer.length = 0;
}

module.exports = { getLogs, clearLogs };
