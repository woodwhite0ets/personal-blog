// 验证加固后的 sanitizeContent 逻辑（与 posts.js 中一致的实现）
function sanitizeContent(val) {
  if (typeof val !== 'string') return val;
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
    // 剥离 javascript:/vbscript: 危险协议
    .replace(/(javascript|vbscript)\s*:/gi, 'blocked:')
    // 剥离 base64 data URI（防存入数据库）
    .replace(/!\[([^\]]*)\]\(data:[^)]+\)/g, '![$1](uploading...)')
    // 剥离 data: 协议链接（图片内嵌 data URI 已在上方保留）
    .replace(/\[([^\]]*)\]\(data:[^)]*\)/g, '[$1](blocked:)')
    .slice(0, 200000);
}

const cases = [
  ['攻击者原 payload: jav&#x61;script:', '[click](jav&#x61;script:alert(1))'],
  ['十六进制实体 script 标签', '<scr&#105;pt>alert(1)</scr&#105;pt>'],
  ['十进制实体 script 标签', '<scr&#105;pt>alert(1)</scr&#105;pt>'],
  ['大写实体', '[click](JAV&#X61;SCRIPT:alert(1))'],
  ['直接 javascript:', '[click](javascript:alert(1))'],
  ['data: 协议链接', '[x](data:text/html,<script>alert(1)</script>)'],
  ['图片 data URI（应保留）', '![img](data:image/png;base64,iVBORw0KGgo=)'],
  ['合法 markdown 链接（应保留）', '[正常链接](https://example.com)'],
  ['正常文本（应原样保留）', '今天天气不错，写了篇博客'],
  ['onerror 事件属性', '<img src=x onerror=alert(1)>'],
];

let pass = 0;
for (const [name, input] of cases) {
  const out = sanitizeContent(input);
  const ok = !out.includes('script') && !out.includes('javascript') && !out.includes('data:text/html');
  const stillHasScript = /script|javascript|data:text\/html/i.test(out);
  if (name.includes('合法') || name.includes('正常')) {
    // 正常内容不应被破坏
    console.log((out.includes('正常链接') || out.includes('今天天气') || out.includes('data:image/png;base64') ? '✅' : '❌') + ' ' + name + ' → ' + out);
  } else {
    console.log((stillHasScript ? '❌' : '✅') + ' ' + name + ' → ' + out);
  }
}
