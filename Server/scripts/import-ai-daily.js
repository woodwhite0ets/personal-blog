#!/usr/bin/env node
/**
 * AI 项目榜导入脚本（在服务器上运行，读采集脚本产出的 JSON）
 *
 * 职责：算日增 → 更新观察池 → 排出当日榜单 → 覆盖写入 ai_daily_items
 *
 * 用法：
 *   node scripts/import-ai-daily.js /tmp/ai-daily-2026-10-24.json
 *   node scripts/import-ai-daily.js /tmp/xxx.json --dry-run
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const DAILY_SIZE = 12;      // 当日榜单条数
const RISER_SLOTS = 8;      // 其中「升星榜」名额
const NEWCOMER_SLOTS = 4;   // 其中「新上榜」名额

function usage(msg) {
  if (msg) console.error(msg);
  console.error('用法: node scripts/import-ai-daily.js <payload.json> [--dry-run]');
  process.exit(1);
}

function clampText(value, max) {
  const s = (value || '').toString().trim();
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function toDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function toDateTime(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) usage('缺少 payload 路径');
  if (!fs.existsSync(file)) usage(`文件不存在: ${file}`);

  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const snapshotDate = toDateOnly(payload.snapshot_date);
  const repos = Array.isArray(payload.repos) ? payload.repos : [];
  if (!snapshotDate) usage('payload 缺少 snapshot_date');
  if (repos.length === 0) usage('payload 里没有仓库');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) 读观察池里这些仓库的旧 star
    const names = repos.map((r) => r.repo);
    const [seenRows] = await conn.query(
      'SELECT repo, stars, prev_stars, first_seen, last_seen FROM ai_repo_seen WHERE repo IN (?)',
      [names]
    );
    const seen = new Map(seenRows.map((r) => [r.repo, r]));

    // 2) 算日增，准备观察池 upsert
    const enriched = repos.map((r) => {
      const prev = seen.get(r.repo);
      let gain = 0;
      let prevStars = r.stars;
      let firstSeen = snapshotDate;
      if (prev) {
        const lastSeen = toDateOnly(prev.last_seen);
        if (lastSeen === snapshotDate) {
          // 同日重复导入：保持 prev_stars，保证幂等
          prevStars = prev.prev_stars;
          gain = r.stars - prev.prev_stars;
        } else {
          prevStars = prev.stars;
          gain = r.stars - prev.stars;
        }
        firstSeen = toDateOnly(prev.first_seen) || snapshotDate;
      }
      return {
        repo: r.repo,
        name: clampText(r.name || r.repo.split('/')[1], 160),
        url: clampText(r.url, 300),
        desc_en: clampText(r.desc_en, 500),
        desc_zh: clampText(r.desc_zh, 300),
        language: clampText(r.language, 40),
        topics: clampText(r.topics, 300),
        stars: Number(r.stars) || 0,
        star_gain: gain,
        prev_stars: prevStars,
        first_seen: firstSeen,
        pushed_at: toDateTime(r.pushed_at),
        is_new: firstSeen === snapshotDate,
        repo_created: r.repo_created || null,
        forks: Number(r.forks) || 0,
        is_geek: r.is_geek ? 1 : 0,
      };
    });

    // 3) 排榜：升星榜 + 新上榜 + 兜底补齐
    //    主榜只用非极客候选；极客候选单独进极客池，避免两类项目在同一份榜单里重复出现
    const mainPool = enriched.filter((r) => !r.is_geek);
    const picked = [];
    const taken = new Set();
    const take = (list, slots) => {
      let n = 0;
      for (const item of list) {
        if (n >= slots) break;
        if (taken.has(item.repo)) continue;
        taken.add(item.repo);
        picked.push(item);
        n += 1;
      }
    };

    const risers = mainPool.filter((r) => r.star_gain > 0).sort((a, b) => b.star_gain - a.star_gain || b.stars - a.stars);
    take(risers, RISER_SLOTS);

    const newcomers = mainPool.filter((r) => r.is_new).sort((a, b) => b.stars - a.stars);
    take(newcomers, NEWCOMER_SLOTS);

    if (picked.length < DAILY_SIZE) {
      const rest = mainPool
        .filter((r) => !taken.has(r.repo))
        .sort((a, b) => b.star_gain - a.star_gain || b.stars - a.stars);
      take(rest, DAILY_SIZE - picked.length);
    }

    // 升星榜靠前，新上榜其次，补位最后
    const ordered = picked.slice(0, DAILY_SIZE);

    console.log(`[import] ${snapshotDate}：候选 ${enriched.length}，升星 ${risers.length}，新上榜 ${newcomers.length}，入选 ${ordered.length}`);
    ordered.forEach((r, i) => {
      const tag = r.star_gain > 0 ? `+${r.star_gain}` : (r.is_new ? 'NEW' : '—');
      console.log(`  ${String(i + 1).padStart(2, ' ')}. ${r.repo}  ★${r.stars} ${tag}  ${r.desc_zh || '(无中文)'}`);
    });

    if (dryRun) {
      await conn.rollback();
      console.log('[import] --dry-run，已回滚');
      return;
    }

    // 4) 更新观察池
    for (const r of enriched) {
      await conn.query(
        `INSERT INTO ai_repo_seen
           (repo, stars, prev_stars, first_seen, last_seen, repo_created,
            name, url, desc_en, desc_zh, language, topics, forks, is_geek)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE stars = VALUES(stars), prev_stars = VALUES(prev_stars), last_seen = VALUES(last_seen),
           repo_created = COALESCE(ai_repo_seen.repo_created, VALUES(repo_created)),
           name = VALUES(name), url = VALUES(url), desc_en = VALUES(desc_en), desc_zh = VALUES(desc_zh),
           language = VALUES(language), topics = VALUES(topics), forks = VALUES(forks), is_geek = VALUES(is_geek)`,
        [
          r.repo, r.stars, r.prev_stars, r.first_seen, snapshotDate, toDateOnly(r.repo_created),
          r.name, r.url, r.desc_en, r.desc_zh, r.language, r.topics, r.forks || 0, r.is_geek ? 1 : 0,
        ]
      );
    }

    // 5) 覆盖当日榜单
    await conn.query('DELETE FROM ai_daily_items WHERE snapshot_date = ?', [snapshotDate]);
    const values = ordered.map((r, i) => [
      snapshotDate, i + 1, r.repo, r.name, r.url, r.desc_en, r.desc_zh,
      r.language, r.stars, r.star_gain, r.topics, r.first_seen, r.pushed_at,
      toDateOnly(r.repo_created), r.forks || 0,
    ]);
    if (values.length) {
      await conn.query(
        `INSERT INTO ai_daily_items
         (snapshot_date, rank_no, repo, name, url, desc_en, desc_zh, language, stars, star_gain, topics, first_seen, pushed_at, repo_created, forks)
         VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    console.log(`[import] 完成：写入 ${values.length} 条（${snapshotDate}）`);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[import] 失败：', err.message);
  process.exit(1);
});
