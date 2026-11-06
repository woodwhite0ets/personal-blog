#!/usr/bin/env bash
# ============================================================================
# 博客一键部署脚本
# ----------------------------------------------------------------------------
# 流程: 推送源码 -> 服务器快进合并 -> 服务器构建前端 -> 安装 Caddyfile
#       -> 校验/重载 Caddy -> 重启 blog -> 端到端验证
#
# 用法:
#   ./scripts/deploy-blog.sh                  # 全量部署（默认直推服务器）
#   ./scripts/deploy-blog.sh --skip-build     # 前端没改，跳过服务器构建
#   ./scripts/deploy-blog.sh --dry-run        # 只打印将执行的命令
#   PUSH_MODE=github ./scripts/deploy-blog.sh # 先推 GitHub，服务器再 pull（需能连 GitHub）
#
# 前置条件:
#   - 本机可 SSH 到博客服务器（默认 ubuntu@192.144.235.179，密钥 ~/.ssh/Ubuntu.pem）
#   - PUSH_MODE=github 时需要能 push 到 GitHub（origin）
#   - 服务器仓库: /home/ubuntu/personal-blog
#
# 为什么不再走「提交 dist 再 pull」：
#   Client/dist 已加进 .gitignore，dist 不会经 git 传输；前端必须在服务器上构建，
#   否则 pull 完只有后端是新的，浏览器拿到的还是旧 bundle（这条坑踩过一次）。
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BLOG_HOST="${BLOG_HOST:-192.144.235.179}"
BLOG_USER="${BLOG_USER:-ubuntu}"
BLOG_REPO="${BLOG_REPO:-/home/ubuntu/personal-blog}"
SITE="${SITE:-https://woodwhite.top}"
BLOG_SITE="${BLOG_SITE:-https://blog.woodwhite.top}"
PUSH_MODE="${PUSH_MODE:-ssh}"   # ssh | github
SKIP_BUILD=0
DRY_RUN=0

# 密钥：优先 ~/.ssh/Ubuntu.pem（本机实际位置），退回仓库根目录的同名文件
SSH_KEY="${SSH_KEY:-$HOME/.ssh/Ubuntu.pem}"
if [ ! -f "$SSH_KEY" ]; then
  SSH_KEY="$ROOT/Ubuntu.pem"
fi

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

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15)
if [ -f "$SSH_KEY" ]; then SSH_OPTS+=(-i "$SSH_KEY"); fi

ssh_run() {
  echo "  [server] $*"
  if [ "$DRY_RUN" = "1" ]; then return 0; fi
  ssh "${SSH_OPTS[@]}" "$BLOG_USER@$BLOG_HOST" "$*"
}

# 端到端检查：打印状态码，异常状态只提示不中断（避免误报把部署判死）
check() {
  local url="$1" want="$2" code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$url" || true)
  if [ "$code" = "$want" ]; then
    echo "  OK   $code  $url"
  else
    echo "  WARN $code (期望 $want)  $url"
  fi
}

echo "==> 1/5 推送源码（PUSH_MODE=$PUSH_MODE）"
if [ "$PUSH_MODE" = "ssh" ]; then
  # 直推服务器：GitHub 不可达时的可用路径，推到 incoming 再快进合并
  export GIT_SSH_COMMAND="ssh ${SSH_OPTS[*]}"
  run git -C "$ROOT" push "ssh://$BLOG_USER@$BLOG_HOST$BLOG_REPO" HEAD:incoming
  echo "==> 2/5 服务器快进合并"
  ssh_run "cd $BLOG_REPO && (git stash push -u -m 'deploy: pre-pull state' --quiet 2>/dev/null || true) && git merge --ff-only incoming && git branch -D incoming >/dev/null && echo MERGE_OK"
elif [ "$PUSH_MODE" = "github" ]; then
  run git -C "$ROOT" push origin main
  echo "==> 2/5 服务器拉取新代码"
  ssh_run "cd $BLOG_REPO && (git stash push -u -m 'deploy: pre-pull state' --quiet 2>/dev/null || true) && git pull --ff-only && echo PULL_OK"
else
  echo "  PUSH_MODE 只能是 ssh 或 github" >&2
  exit 64
fi

echo "==> 3/5 服务器端构建前端"
if [ "$SKIP_BUILD" = "1" ]; then
  echo "  (跳过构建)"
else
  # 先出 dist.new 再切换，避免 vite 清空 outDir 时出现 index.html 短暂 404 的窗口
  ssh_run "cd $BLOG_REPO/Client && npm ci --no-audit --no-fund && npx vite build --outDir dist.new --emptyOutDir && ts=\$(date +%Y%m%d-%H%M%S) && mv dist dist.backup-\$ts && mv dist.new dist && echo BUILD_OK"
fi

echo "==> 4/5 安装 Caddyfile + 校验 + 重载"
# 仓库 Server/deploy/Caddyfile 是唯一真源，覆盖服务器 /etc/caddy/Caddyfile。
# 注意：caddy validate 以 root 运行会顺带创建日志文件（root:root），
# 重载时 caddy 用户写不进去会 400，所以校验后统一把 /var/log/caddy 还权给 caddy。
ssh_run "sudo cp $BLOG_REPO/Server/deploy/Caddyfile /etc/caddy/Caddyfile && sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null && sudo chown -R caddy:caddy /var/log/caddy && sudo systemctl reload caddy && echo CADDY_OK"

echo "==> 4.5/5 重启 blog（pm2）并等就绪"
# 启动要先跑 ensureDatabase / 邮件初始化（2-3s）；只 sleep 2 会在启动窗口里查出 502
ssh_run "pm2 restart blog >/dev/null && for i in \$(seq 1 30); do curl -sf -o /dev/null http://127.0.0.1:3027/robots.txt && echo PM2_OK && exit 0; sleep 1; done; echo PM2_NOT_READY; exit 1"

echo "==> 5/5 端到端验证"
if [ "$DRY_RUN" = "0" ]; then
  check "$SITE/" 200
  check "$SITE/work" 200
  check "$SITE/stack" 200
  check "$SITE/contact" 200
  check "$SITE/solutions" 301
  check "$SITE/robots.txt" 200
  check "$BLOG_SITE/blog" 200
  check "$BLOG_SITE/projects" 200
  check "$BLOG_SITE/healthz" 200
  check "$BLOG_SITE/api/gateway/me" 401
fi

echo "==> 完成。"
