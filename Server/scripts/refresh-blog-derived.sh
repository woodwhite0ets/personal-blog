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
node Server/scripts/build-notes.mjs --out "$NOTES_JSON"
scp -q "$NOTES_JSON" "${REMOTE_HOST}:${REMOTE_DIR}/data/notes.json"

log "完成"
