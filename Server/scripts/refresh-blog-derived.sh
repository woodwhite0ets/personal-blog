#!/usr/bin/env bash
# 刷新博客的派生数据（在工作站运行）：
#   1) 语义相关文章：bge-m3 嵌入 → 每篇 top3 → 服务器导库
#   2) 知识库公开索引：/data/knowledge → notes.json → 服务器
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REMOTE_HOST="${REMOTE_HOST:-blog}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/personal-blog/Server}"
REL_JSON="/tmp/post-related-$$.json"
NOTES_JSON="/tmp/notes-$$.json"
cleanup() { rm -f "$REL_JSON" "$NOTES_JSON"; }
trap cleanup EXIT
log() { printf '[blog-derived] %s %s\n' "$(date '+%F %T')" "$*"; }

cd "$REPO"

log "生成语义相关文章"
node Server/scripts/build-post-related.mjs --out "$REL_JSON"
scp -q "$REL_JSON" "${REMOTE_HOST}:/tmp/post-related.json"
ssh "$REMOTE_HOST" "cd '${REMOTE_DIR}' && node scripts/import-post-related.js /tmp/post-related.json && rm -f /tmp/post-related.json"

log "生成笔记索引"
# 2026-11-02：旧知识库 /data/knowledge 已迁到 /data/kb，且新库没有公开白名单字段。
# build-notes.mjs 会整篇发布正文（只做脱敏），直接指向新库等于把内网笔记公开，
# 所以默认跳过；要恢复发布，先给条目加 `public: true` 并在 build-notes.mjs 里加过滤。
KB_ROOT="${KB_ROOT:-/data/knowledge}"
if [ -d "$KB_ROOT" ]; then
  export KB_ROOT
  node Server/scripts/build-notes.mjs --out "$NOTES_JSON"
  scp -q "$NOTES_JSON" "${REMOTE_HOST}:${REMOTE_DIR}/data/notes.json"
else
  log "跳过笔记索引：$KB_ROOT 不存在（知识库已迁 /data/kb，未选公开子集）"
fi

log "完成"
