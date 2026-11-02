/**
 * 工具库人工维护字段的校验（纯函数，无 db/鉴权依赖，方便单测）
 *
 * 只接受人能改的字段：分类、一句话、实测评价、标签、形态、定价、需不需要 key、中文界面、状态、排序权重。
 * 采集来的指标（stars / last_commit / desc_en）不在这里改，避免人工和采集互相覆盖。
 */
const CATEGORIES = require('../config/ai-tool-categories.json');

const CAT_KEYS = new Set(CATEGORIES.map((c) => c.key));
const FORMS = new Set(['web', 'desktop', 'cli', 'library', 'model', 'plugin']);
const PRICINGS = new Set(['free', 'freemium', 'paid', 'api']);
const STATUSES = new Set(['candidate', 'featured', 'hidden']);

const clampStr = (v, max) => [...String(v == null ? '' : v)].slice(0, max).join('').trim();

function buildToolUpdate(body) {
  const src = body && typeof body === 'object' ? body : {};
  const fields = {};

  if ('category' in src) {
    if (!CAT_KEYS.has(src.category)) return { ok: false, error: `invalid category: ${src.category}` };
    fields.category = src.category;
  }

  if ('status' in src) {
    if (!STATUSES.has(src.status)) return { ok: false, error: `invalid status: ${src.status}` };
    fields.status = src.status;
  }

  if ('form' in src) {
    if (!FORMS.has(src.form)) return { ok: false, error: `invalid form: ${src.form}` };
    fields.form = src.form;
  }

  if ('pricing' in src) {
    if (!PRICINGS.has(src.pricing)) return { ok: false, error: `invalid pricing: ${src.pricing}` };
    fields.pricing = src.pricing;
  }

  if ('tagline_zh' in src) fields.tagline_zh = clampStr(src.tagline_zh, 120);

  if ('note_zh' in src) {
    const note = clampStr(src.note_zh, 300);
    fields.note_zh = note === '' ? null : note;
  }

  if ('tags' in src) {
    const tags = String(src.tags == null ? '' : src.tags)
      .split(',')
      .map((t) => clampStr(t.replace(/^#/, ''), 12))
      .filter(Boolean)
      .slice(0, 6);
    fields.tags = tags.join(',');
  }

  for (const key of ['needs_key', 'zh_ui']) {
    if (key in src) {
      const v = src[key];
      fields[key] = v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
    }
  }

  if ('weight' in src) {
    const n = Number(src.weight);
    if (!Number.isFinite(n)) return { ok: false, error: 'weight must be a number' };
    fields.weight = Math.max(-999, Math.min(999, Math.round(n)));
  }

  if (Object.keys(fields).length === 0) return { ok: false, error: 'no editable fields provided' };
  return { ok: true, fields };
}

module.exports = { buildToolUpdate, CAT_KEYS, FORMS, PRICINGS, STATUSES };
