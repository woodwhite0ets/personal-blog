# -*- coding: utf-8 -*-
# 禁用保留用户名注册（防抢注 admin/root 冒充）
import io

p = r'C:\Users\19037\Desktop\Blog\Server\src\routes\auth.js'
with io.open(p, 'r', encoding='utf-8', newline='') as f:
    c = f.read()

EOL = '\r\n'

# 1. 在 router 定义后插入保留用户名常量
anchor1 = 'const router = express.Router();' + EOL
assert c.count(anchor1) == 1, 'anchor1 count=%d' % c.count(anchor1)
add1 = EOL.join([
    'const router = express.Router();',
    '',
    '// 保留用户名（防抢注 admin/root 等冒充管理员/系统账号）',
    "const RESERVED_USERNAMES = ['admin', 'administrator', 'root', 'sysadmin', 'superuser', 'superadmin', 'system'];",
    '',
]) + EOL
c = c.replace(anchor1, add1)

# 2. 在 username 格式校验后插入保留用户名检查
anchor2 = EOL.join([
    "    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {",
    "      return res.status(400).json({ message: 'username: 3-20 chars, letters/numbers/underscore only' });",
    "    }",
]) + EOL
assert c.count(anchor2) == 1, 'anchor2 count=%d' % c.count(anchor2)
add2 = EOL.join([
    "    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {",
    "      return res.status(400).json({ message: 'username: 3-20 chars, letters/numbers/underscore only' });",
    "    }",
    "    // 保留用户名黑名单（防抢注 admin/root 冒充管理员）",
    "    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {",
    "      return res.status(400).json({ message: 'this username is reserved and cannot be used' });",
    "    }",
]) + EOL
c = c.replace(anchor2, add2)

with io.open(p, 'w', encoding='utf-8', newline='') as f:
    f.write(c)
print('auth.js 已禁用保留用户名')
