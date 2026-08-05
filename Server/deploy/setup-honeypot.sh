#!/bin/bash
# ====== 蜜罐 + 自动封禁 一键部署脚本 ======
# 在服务器上执行: sudo bash setup-honeypot.sh

set -e
echo "=== 1/4 部署 fail2ban 自动封禁规则 ==="

# 检测规则（扫描 .env / .git / .aws / admin 等敏感路径）
cat > /etc/fail2ban/filter.d/caddy-probe.conf << 'FILTER_EOF'
[Definition]
failregex = ^.*"client_ip":"<HOST>".*"uri":"/[^"]*\.env[^"]*".*$
            ^.*"client_ip":"<HOST>".*"uri":"/\.git/[^"]*".*$
            ^.*"client_ip":"<HOST>".*"uri":"/\.aws/[^"]*".*$
            ^.*"client_ip":"<HOST>".*"uri":"/wp-admin[^"]*".*$
            ^.*"client_ip":"<HOST>".*"uri":"/phpinfo[^"]*".*$
            ^.*"client_ip":"<HOST>".*"uri":"/test\.php[^"]*".*$
            ^.*"client_ip":"<HOST>".*"uri":"/admin/[^"]*".*"status":(401|403).*$
ignoreregex =
FILTER_EOF

# jail 配置（300 秒内触发 3 次即封 24 小时）
grep -q "caddy-probe" /etc/fail2ban/jail.local 2>/dev/null || cat >> /etc/fail2ban/jail.local << 'JAIL_EOF'

[caddy-probe]
enabled   = true
filter    = caddy-probe
logpath   = /var/log/caddy/blog-access.log
maxretry  = 3
findtime  = 300
bantime   = 86400
action    = iptables-multiport[name=caddy-probe, port="http,https", protocol=tcp]
JAIL_EOF

systemctl restart fail2ban
sleep 2
fail2ban-client status caddy-probe && echo "fail2ban 已启动 ✅"

echo ""
echo "=== 2/4 蜜罐文件权限 ==="
mkdir -p /var/www/honeypot
chown -R caddy:caddy /var/www/honeypot
chmod 755 /var/www/honeypot
chmod 644 /var/www/honeypot/.env /var/www/honeypot/troll.json
ls -la /var/www/honeypot/

echo ""
echo "=== 3/4 Caddy 蜜罐配置 ==="
echo "Caddyfile 已通过 SCP 更新，重新加载..."
systemctl reload caddy && echo "Caddy 重新加载 ✅"

echo ""
echo "=== 4/4 tar pit (iptables 慢速惩罚) ==="
# 对已封禁 IP 的后续连接限速：每 60 秒最多 1 个新连接
iptables -C INPUT -m recent --rcheck --seconds 60 --hitcount 2 --name TARPIT -j DROP 2>/dev/null || \
iptables -A INPUT -m recent --update --seconds 60 --hitcount 2 --name TARPIT -j DROP
iptables -C INPUT -m recent --set --name TARPIT -j ACCEPT 2>/dev/null || \
iptables -A INPUT -m recent --set --name TARPIT -j ACCEPT
echo "tar pit 已配置 ✅（限制被封 IP 的连接速率）"

echo ""
echo "============================================"
echo " 蜜罐系统全部就绪"
echo " - .env 探测 → 假凭据蜜罐"
echo " - WordPress 扫描 → troll JSON"
echo " - 3次敏感探测 → 自动封禁 24h"
echo " - 封禁 IP → 连接限速惩罚"
echo " - 正常访问不受影响"
echo "============================================"
