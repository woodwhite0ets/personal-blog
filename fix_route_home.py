# -*- coding: utf-8 -*-
# 修复：/ 改为首页(帖子内容)，登录页移到 /login
import io

def load(p):
    with io.open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()

def save(p, content):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

BASE = r'C:\Users\19037\Desktop\Blog\Client\src'
EOL = '\r\n'

# ========== 1. router/index.js ==========
p = BASE + r'\router\index.js'
c = load(p)

# 1a. '/' 路由改为重定向首页 + 新增 /login 路由
anchor = EOL.join([
    "  {",
    "    path: '/',",
    "    name: 'LoginPage',",
    "    component: () => import('../components/Login/Login.vue'),",
    "  },",
    "",
])
assert c.count(anchor) == 1, 'router routes anchor=%d' % c.count(anchor)
new = EOL.join([
    "  {",
    "    path: '/',",
    "    redirect: '/HomePage',",
    "  },",
    "  {",
    "    path: '/login',",
    "    name: 'LoginPage',",
    "    component: () => import('../components/Login/Login.vue'),",
    "  },",
    "",
])
c = c.replace(anchor, new)

# 1b. 守卫重定向去登录页（5 处）
old_guard = "return next({ path: '/', query: { redirect: to.fullPath } });"
new_guard = "return next({ path: '/login', query: { redirect: to.fullPath } });"
cnt = c.count(old_guard)
assert cnt == 5, 'guard count=%d' % cnt
c = c.replace(old_guard, new_guard)
save(p, c)
print('router/index.js OK (守卫 %d 处)' % cnt)

# ========== 2. 登录相关链接 → /login ==========
for f, old, new in [
    (r'\components\Homepage\ForumPage.vue', 'to="/"', 'to="/login"'),
    (r'\components\Homepage\Homepage.vue', 'to="/"', 'to="/login"'),
    (r'\components\Post\PostDetail.vue', 'to="/"', 'to="/login"'),
    (r'\components\Login\ResetPassword.vue', 'to="/"', 'to="/login"'),
    (r'\components\Login\ForgotPassword.vue', 'to="/"', 'to="/login"'),
    (r'\components\Login\Register.vue', 'to="/"', 'to="/login"'),
]:
    fp = BASE + f
    fc = load(fp)
    n = fc.count(old)
    if n > 0:
        fc = fc.replace(old, new)
        save(fp, fc)
    print('%s: 替换 %d 处' % (f, n))

# ========== 3. PostDetail 点赞跳登录页 ==========
p = BASE + r'\components\Post\PostDetail.vue'
c = load(p)
old = "    router.push('/')"
new = "    router.push('/login')"
assert c.count(old) == 1, 'PostDetail push count=%d' % c.count(old)
c = c.replace(old, new)
save(p, c)
print('PostDetail push OK')

# ========== 4. EditorPage 未登录跳登录页 ==========
p = BASE + r'\components\Editor\EditorPage.vue'
c = load(p)
old = "    router.push('/')"
assert c.count(old) == 2, 'EditorPage push count=%d' % c.count(old)
c = c.replace(old, "    router.push('/login')")
save(p, c)
print('EditorPage push OK (2 处)')

# ========== 5. auth.js 登出回首页 ==========
p = BASE + r'\stores\auth.js'
c = load(p)
old = "    router.push('/')"
assert c.count(old) == 1, 'auth logout count=%d' % c.count(old)
c = c.replace(old, "    router.push('/HomePage')")
save(p, c)
print('auth.js logout OK')

print('All done.')
