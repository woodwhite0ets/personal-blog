const test = require('node:test');
const assert = require('node:assert');
const { buildToolUpdate } = require('../src/utils/toolPatch');

test('接受合法字段并原样返回', () => {
  const r = buildToolUpdate({
    category: 'code',
    status: 'featured',
    form: 'cli',
    pricing: 'free',
    tagline_zh: '  终端里的编码代理  ',
    note_zh: '我每天在用',
    tags: '#终端, 编码代理 ,,',
    needs_key: true,
    zh_ui: false,
    weight: 60,
  });
  assert.equal(r.ok, true);
  assert.equal(r.fields.category, 'code');
  assert.equal(r.fields.status, 'featured');
  assert.equal(r.fields.tagline_zh, '终端里的编码代理');
  assert.equal(r.fields.tags, '终端,编码代理');
  assert.equal(r.fields.needs_key, 1);
  assert.equal(r.fields.zh_ui, 0);
  assert.equal(r.fields.weight, 60);
});

test('拒绝非法分类 / 状态 / 形态 / 定价', () => {
  assert.equal(buildToolUpdate({ category: 'nope' }).ok, false);
  assert.equal(buildToolUpdate({ status: 'published' }).ok, false);
  assert.equal(buildToolUpdate({ form: 'mobile' }).ok, false);
  assert.equal(buildToolUpdate({ pricing: 'gratis' }).ok, false);
});

test('权重取整并夹在 ±999 之间', () => {
  assert.equal(buildToolUpdate({ weight: 12.7 }).fields.weight, 13);
  assert.equal(buildToolUpdate({ weight: 99999 }).fields.weight, 999);
  assert.equal(buildToolUpdate({ weight: -5 }).fields.weight, -5);
  assert.equal(buildToolUpdate({ weight: 'abc' }).ok, false);
});

test('空评价存 NULL，超长截断', () => {
  assert.equal(buildToolUpdate({ note_zh: '   ' }).fields.note_zh, null);
  assert.equal([...buildToolUpdate({ note_zh: '评'.repeat(400) }).fields.note_zh].length, 300);
  assert.equal([...buildToolUpdate({ tagline_zh: '句'.repeat(200) }).fields.tagline_zh].length, 120);
});

test('标签去重前先清洗，最多 6 个', () => {
  const r = buildToolUpdate({ tags: 'a,b,c,d,e,f,g,h' });
  assert.equal(r.fields.tags, 'a,b,c,d,e,f');
});

test('没有任何可改字段时报错', () => {
  assert.equal(buildToolUpdate({}).ok, false);
  assert.equal(buildToolUpdate({ stars: 100 }).ok, false);
  assert.equal(buildToolUpdate({ repo: 'x/y' }).ok, false);
  assert.equal(buildToolUpdate(null).ok, false);
});
