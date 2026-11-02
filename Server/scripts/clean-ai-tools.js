#!/usr/bin/env node
/**
 * 工具库数据清洗（服务器上运行，不调模型，幂等）
 *
 * 三件事：
 *   1. 把 awesome 清单 / 教程 / 资源汇总从用途分类里摘出来，归到 list
 *   2. 标签去噪：去掉和简介撞词、和分类名重复、以及「AI / 工具 / 开源」这类没信息量的标签
 *   3. 简介开头重复项目名的，把项目名去掉
 *
 * 人工改过的行（source='manual'）一律不动。
 *
 * 用法：node scripts/clean-ai-tools.js [--dry-run]
 */
const pool = require('../src/config/db');
const CATEGORIES = require('../src/config/ai-tool-categories.json');

const dryRun = process.argv.includes('--dry-run');

const CAT_LABEL = new Map(CATEGORIES.map((c) => [c.key, c.label]));
const LIST_NAME = /awesome|cheatsheet|cheat-sheet|roadmap|tutorial|guide|handbook|-list\b|_list\b|collection/i;
const LIST_DESC = /curated list|hand-picked|a collection of|awesome list|roadmap|\btutorials?\b|book series|资源大全|教程合集|合集|全书|书稿/i;
const isListing = (name, desc) => LIST_NAME.test(String(name || '')) || LIST_DESC.test(String(desc || ''));
const GENERIC_TAGS = new Set(['AI', 'ai', '人工智能', 'AI工具', '工具', '开源', '开源项目', '大模型', 'LLM', 'llm']);

const cleanTags = (tags, tagline, catLabel) => {
  const out = [];
  for (const raw of String(tags || '').split(',')) {
    const t = raw.trim().replace(/^#/, '');
    if (!t || GENERIC_TAGS.has(t) || t === catLabel) continue;
    if (tagline && tagline.includes(t)) continue;
    if (out.includes(t)) continue;
    out.push(t);
    if (out.length >= 3) break;
  }
  return out.join(',');
};

const cleanTagline = (tagline, name) => {
  let t = String(tagline || '').trim().replace(/^[\s:：,，-]+/, '');
  const n = String(name || '').trim();
  if (!n) return t;
  for (const cand of [n, n.replace(/[-_.]/g, ' ')]) {
    if (cand && t.toLowerCase().startsWith(cand.toLowerCase())) {
      t = t.slice(cand.length).replace(/^[\s:：,，是的]+/, '');
    }
  }
  return t;
};

(async () => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query(
      "SELECT id, name, desc_en, tagline_zh, tags, category, status, source FROM ai_tools WHERE source <> 'manual'"
    );

    let movedToList = 0;
    let tagsChanged = 0;
    let taglineChanged = 0;
    const updated = [];

    for (const r of rows) {
      let category = r.category;
      let tagline = r.tagline_zh || '';
      let tags = r.tags || '';

      if (category !== 'list' && isListing(r.name, r.desc_en)) {
        category = 'list';
        movedToList += 1;
      }

      const newTagline = cleanTagline(tagline, r.name);
      if (newTagline !== tagline) {
        tagline = newTagline;
        taglineChanged += 1;
      }

      const newTags = cleanTags(tags, tagline, CAT_LABEL.get(category) || '');
      if (newTags !== tags) {
        tags = newTags;
        tagsChanged += 1;
      }

      if (category !== r.category || tags !== (r.tags || '') || tagline !== (r.tagline_zh || '')) {
        updated.push([category, tags, tagline, r.id]);
      }
    }

    if (dryRun) {
      console.log(
        `[clean] --dry-run：归入 list ${movedToList}，标签改动 ${tagsChanged}，简介改动 ${taglineChanged}，待更新 ${updated.length}`
      );
      return;
    }

    for (const [category, tags, tagline, id] of updated) {
      await conn.query('UPDATE ai_tools SET category = ?, tags = ?, tagline_zh = ? WHERE id = ?', [
        category,
        tags,
        tagline,
        id,
      ]);
    }
    console.log(
      `[clean] 完成：归入 list ${movedToList}，标签改动 ${tagsChanged}，简介改动 ${taglineChanged}，更新 ${updated.length} 行（人工行未动）`
    );

    const [dist] = await conn.query(
      'SELECT category, COUNT(*) AS n FROM ai_tools GROUP BY category ORDER BY n DESC'
    );
    console.log(`[clean] 分类分布：${dist.map((d) => `${d.category}:${d.n}`).join(' ')}`);
  } catch (err) {
    console.error('[clean] 失败：', err.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
})();
