#!/usr/bin/env bash
# 博客「AI 项目榜」每日任务（在工作站运行）
# 流程：本机采集 GitHub + 本地模型生成中文 → 传到服务器 → 服务器算日增并写库
# 由 systemd user timer（ai-daily.timer，每天 08:00）触发，也可手工执行。
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REMOTE_HOST="${REMOTE_HOST:-blog}"
REMOTE_DIR="${REMOTE_DIR:-/home/ubuntu/personal-blog/Server}"
DATE="$(date +%F)"
LOCAL_JSON="/tmp/ai-daily-${DATE}.json"
REMOTE_JSON="/tmp/ai-daily-${DATE}.json"

cleanup() { rm -f "$LOCAL_JSON"; }
trap cleanup EXIT

log() { printf '[ai-daily] %s %s\n' "$(date '+%F %T')" "$*"; }

cd "$REPO"

log "采集 ${DATE}（GitHub + 本地模型）"
node Server/scripts/collect-ai-daily.mjs --out "$LOCAL_JSON"

log "传输到 ${REMOTE_HOST}:${REMOTE_JSON}"
scp -q "$LOCAL_JSON" "${REMOTE_HOST}:${REMOTE_JSON}"

log "服务器导入并排榜"
ssh "$REMOTE_HOST" "cd '${REMOTE_DIR}' && node scripts/import-ai-daily.js '${REMOTE_JSON}' && rm -f '${REMOTE_JSON}'"

log "采集模型目录（OpenRouter 公开 API）"
MODELS_JSON="/tmp/ai-models-${DATE}.json"
REMOTE_MODELS="/tmp/ai-models-${DATE}.json"
node Server/scripts/collect-models.mjs --out "$MODELS_JSON"
scp -q "$MODELS_JSON" "${REMOTE_HOST}:${REMOTE_MODELS}"
ssh "$REMOTE_HOST" "cd '${REMOTE_DIR}' && node scripts/import-models.js '${REMOTE_MODELS}' && rm -f '${REMOTE_MODELS}'"
rm -f "$MODELS_JSON"

log "完成"
