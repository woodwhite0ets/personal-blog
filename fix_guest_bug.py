# -*- coding: utf-8 -*-
# 修复：移除自动游客登录（避免 guest 限流 429 导致进不去）
# + 放宽游客登录限流
import io

def load(p):
    with io.open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()

def save(p, content):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

EOL = '\r\n'

# ========== 1. App.vue — 移除自动游客登录，回退为仅恢复已有会话 ==========
p = r'C:\Users\19037\Desktop\Blog\Client\src\App.vue'
c = load(p)

anchor1 = EOL.join([
    "import { onMounted } from 'vue'",
    "import { useAuth, getToken, isGuest } from './stores/auth.js'",
    "",
    "const { fetchMe, loginAsGuest } = useAuth()",
    "",
    "onMounted(async () => {",
    "  await fetchMe()",
    "  // 完全未登录 → 自动以游客身份进入（访客/HR 无需注册即可浏览，评论/点赞时再提示登录）",
    "  if (!getToken() && !isGuest()) {",
    "    try { await loginAsGuest() } catch {}",
    "  }",
    "})",
    "",
])
assert c.count(anchor1) == 1, 'App.vue anchor=%d' % c.count(anchor1)
new1 = EOL.join([
    "import { onMounted } from 'vue'",
    "import { useAuth } from './stores/auth.js'",
    "",
    "const { fetchMe } = useAuth()",
    "",
    "onMounted(() => fetchMe())",
    "",
])
c = c.replace(anchor1, new1)
save(p, c)
print('App.vue 已回退')

# ========== 2. auth.js — 放宽游客登录限流（3 → 30 / 分钟） ==========
p = r'C:\Users\19037\Desktop\Blog\Server\src\routes\auth.js'
c = load(p)

anchor2 = EOL.join([
    "const guestLimiter = rateLimit({",
    "  windowMs: 60 * 1000,",
    "  max: 3,",
    "  standardHeaders: true,",
    "  legacyHeaders: false,",
    "  message: { message: 'too many guest requests — slow down' },",
    "});",
])
assert c.count(anchor2) == 1, 'auth.js anchor=%d' % c.count(anchor2)
new2 = EOL.join([
    "const guestLimiter = rateLimit({",
    "  windowMs: 60 * 1000,",
    "  max: 30,             // 游客登录限流放宽（防误伤正常访客/HR 浏览）",
    "  standardHeaders: true,",
    "  legacyHeaders: false,",
    "  message: { message: 'too many guest requests — slow down' },",
    "});",
])
c = c.replace(anchor2, new2)
save(p, c)
print('auth.js guestLimiter 已放宽')

print('All done.')
