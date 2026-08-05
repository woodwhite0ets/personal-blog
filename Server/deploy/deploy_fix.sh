#!/bin/bash
# ===== 手动部署 XSS 加固 + 清理攻击者数据 =====
# 在服务器上执行: bash deploy_fix.sh
# 若 Claude Code 无法自动执行时，由管理员手动运行
set -e

echo "=== 1/3 重启后端服务（加载加固后的 sanitizeContent）==="
pm2 restart blog-api || pm2 restart all
sleep 2

echo ""
echo "=== 2/3 删除攻击者数据（XSS 帖 #25、测试帖 #19、tttt 账号）==="
cd /home/ubuntu/personal-blog/Server
node deploy/cleanup_attacker.js

echo ""
echo "=== 3/3 复扫确认数据库干净 ==="
node deploy/check_xss_deep.js

echo ""
echo "完成 ✅"
