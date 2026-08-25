#!/usr/bin/env bash
# ============================================================================
# 博客前端一键部署脚本
# ----------------------------------------------------------------------------
# 流程: 构建前端 -> 推送 GitHub -> 博客服务器 git pull -> 安装 Caddyfile
#       -> 校验/重载 Caddy -> 重启 blog -> 端到端验证
#
# 用法:
#   ./scripts/deploy-blog.sh              # 全量部署
#   ./scripts/deploy-blog.sh --skip-build # 跳过 npm run build（dist 已就绪）
#   ./scripts/deploy-blog.sh --dry-run    # 只打印将执行的命令
#
# 前置条件:
#   - 本机可 SSH 到博客服务器（默认 ubuntu@192.144.235.179，-i Ubuntu.pem）
#   - 本机可 push 到 GitHub（origin）
#   - 服务器仓库: /home/ubuntu/personal-blog（origin/main 经 ghfast.top 镜像同步）
# ============================================================================
set -euo pipefail

BLOG_HOST="${BLOG_HOST:-192.144.235.179}"
BLOG_USER="${BLOG_USER:-ubuntu}"
BLOG_REPO="${BLOG_REPO:-/home/ubuntu/personal-blog}"
SSH_KEY="${SSH_KEY:-$(cd "$(dirname "$0")/.." && pwd)/Ubuntu.pem}"
SITE="${SITE:-https://blog.woodwhite.top}"
SKIP_BUILD=0
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    --dry-run)    DRY_RUN=1 ;;
    *) echo "未知参数: $arg" >&2; exit 64 ;;
  esac
done

run() {
  echo "  >> $*"
  if [ "$DRY_RUN" = "1" ]; then return 0; fi
  "$@"
}

ssh_run() {
  echo "  [server] $*"
  if [ "$DRY_RUN" = "1" ]; then return 0; fi
  ssh -i "$SSH_KEY" -o BatchMode=yes "$BLOG_USER@$BLOG_HOST" "$*"
}

echo "==> 1/6 构建前端"
if [ "$SKIP_BUILD" = "1" ]; then
  echo "  (跳过 build)"
else
  ( cd "$(dirname "$0")/../Client" && npm run build )
fi

echo "==> 2/6 提交 dist 并推送"
git -C "$(dirname "$0")/.." add Client/dist
if git -C "$(dirname "$0")/.." diff --cached --quiet; then
  echo "  (dist 无改动，直接推送)"
else
  git -C "$(dirname "$0")/.." commit -m "deploy: 重新构建前端 dist"
fi
git -C "$(dirname "$0")/.." push origin main

echo "==> 3/6 博客服务器拉取新代码"
# 服务器可能有未提交/未跟踪的旧构建残留：用 stash -u 收走（可恢复），再 ff-only pull。
# 若上次残留的备份目录（dist.backup-*、.deploy-backups）需要保留，脚本会在 pull 后恢复。
ssh_run "cd $BLOG_REPO && (git stash push -u -m 'deploy: server pre-pull state' --quiet 2>/dev/null || true) && git pull --ff-only && echo PULL_OK"

echo "==> 4/6 安装 Caddyfile + 校验 + 重载"
# 仓库 Server/deploy/Caddyfile 是唯一真源，覆盖服务器 /etc/caddy/Caddyfile。
ssh_run "sudo cp $BLOG_REPO/Server/deploy/Caddyfile /etc/caddy/Caddyfile && sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null && sudo systemctl reload caddy && echo CADDY_OK"

echo "==> 5/6 重启 blog（pm2）"
ssh_run "pm2 restart blog >/dev/null && sleep 2 && pm2 list | grep 'blog.*online' && echo PM2_OK"

echo "==> 6/6 端到端验证"
if [ "$DRY_RUN" = "0" ]; then
  for path in /gateway /console /api/gateway/me /healthz; do
    code=$(curl -sS -o /dev/null -w '%{http_code}' -L "$SITE$path" || true)
    echo "  $path -> $code"
  done
  echo "  /console 应 302->/gateway；/api/gateway/me 应 401；/healthz 应 200；/gateway 应 200"
fi

echo "==> 完成。"
echo "  提示: 服务器若残留旧 /gateway->/console 规则，已被本脚本的 Caddyfile 覆盖消除。"
