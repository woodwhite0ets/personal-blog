// 安全关键纯函数单元测试（node --test，无需数据库）
const { test } = require('node:test');
const assert = require('node:assert');
const {
  sanitizeText, sanitizeContent, sanitizeTag, validateCoverImage,
  validatePassword, validateUsername,
} = require('../src/utils/sanitize');
const { containsBannedWord } = require('../src/config/wordFilter');

test('sanitizeText: 去除 HTML 标签与尖括号', () => {
  assert.strictEqual(sanitizeText('<b>hi</b>'), 'hi');
  assert.strictEqual(sanitizeText('a < b > c'), 'a  c'); // < b > 视作标签被剥离
});

test('sanitizeText: 剥离数字字符引用（实体混淆）', () => {
  assert.ok(!sanitizeText('&#60;script&#62;').includes('&#'));
  assert.strictEqual(sanitizeText('x&#x61;y'), 'xy');
});

test('sanitizeText: 截断到 maxLen 并 trim', () => {
  assert.strictEqual(sanitizeText('abcdef', 3), 'abc');
  assert.strictEqual(sanitizeText('   padded   '), 'padded');
});

test('sanitizeContent: 剥离 script/iframe/object/embed', () => {
  const out = sanitizeContent('<script>alert(1)</script>ok<iframe src=x></iframe>');
  assert.ok(!/script|iframe/i.test(out));
  assert.ok(out.includes('ok'));
});

test('sanitizeContent: 剥离事件处理器属性', () => {
  const out = sanitizeContent('<img src=x onerror=alert(1)>');
  assert.ok(!/onerror/i.test(out));
});

test('sanitizeContent: 阻断 javascript: 协议', () => {
  const out = sanitizeContent('<a href="javascript:alert(1)">x</a>');
  assert.ok(!/javascript:/i.test(out));
});

test('sanitizeContent: 剥离 data: URI 但保留普通 markdown', () => {
  const out = sanitizeContent('![a](data:image/png;base64,AAAA) 正文 **加粗**');
  assert.ok(!/data:/i.test(out));
  assert.ok(out.includes('正文'));
  assert.ok(out.includes('**加粗**'));
});

test('sanitizeContent: 非字符串原样返回', () => {
  assert.strictEqual(sanitizeContent(null), null);
  assert.strictEqual(sanitizeContent(123), 123);
});

test('sanitizeTag: 去除特殊字符并截断', () => {
  assert.strictEqual(sanitizeTag('a/b\\c:d*e'), 'abcde');
  assert.strictEqual(sanitizeTag('x'.repeat(50)).length, 30);
});

test('validateCoverImage: 只允许 /uploads/ 路径', () => {
  assert.ok(validateCoverImage(''));
  assert.ok(validateCoverImage('/uploads/posts/a/cover.png'));
  assert.ok(!validateCoverImage('https://evil.com/x.png'));
  assert.ok(!validateCoverImage('/etc/passwd'));
  assert.ok(!validateCoverImage('/uploads/' + 'a'.repeat(500)));
});

test('validatePassword: 强度规则', () => {
  assert.ok(validatePassword('short1'));           // <8
  assert.ok(validatePassword('allletters'));       // 无数字
  assert.ok(validatePassword('12345678'));         // 无字母
  assert.ok(validatePassword('a1'.repeat(70)));    // >128
  assert.strictEqual(validatePassword('abc12345'), null);
});

test('validateUsername: 格式与保留名', () => {
  assert.ok(validateUsername('ab'));               // 太短
  assert.ok(validateUsername('a b'));              // 非法字符
  assert.ok(validateUsername('ADMIN'));            // 保留名（大小写不敏感）
  assert.strictEqual(validateUsername('alice_01'), null);
});

test('wordFilter: 命中违禁词', () => {
  assert.ok(containsBannedWord('fuck'));
  assert.ok(containsBannedWord('你这个傻逼'));
  assert.ok(!containsBannedWord('classic pass'));
});
