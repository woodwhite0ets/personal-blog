# -*- coding: utf-8 -*-
# 功能：默认游客模式 + 点赞未登录提示登录
import io

def load(p):
    with io.open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()

def save(p, content):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

BASE = r'C:\Users\19037\Desktop\Blog\Client\src'
EOL = '\r\n'

# ========== 1. App.vue — 应用启动自动游客登录 ==========
p = BASE + r'\App.vue'
c = load(p)

anchor1 = EOL.join([
    "import { onMounted } from 'vue'",
    "import { useAuth } from './stores/auth.js'",
    "",
    "const { fetchMe } = useAuth()",
    "",
    "onMounted(() => fetchMe())",
    "",
])
assert c.count(anchor1) == 1, 'App.vue anchor=%d' % c.count(anchor1)
new1 = EOL.join([
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
c = c.replace(anchor1, new1)
save(p, c)
print('App.vue OK')

# ========== 2. PostDetail.vue — 点赞未登录提示登录 ==========
p = BASE + r'\components\Post\PostDetail.vue'
c = load(p)

# 2a. 按钮：去掉未登录 disabled，改为可点击触发提示
anchor2 = EOL.join([
    '          <button class="btn-like" :class="{ liked: post.user_liked }" @click="toggleLike" :disabled="liking || !isLoggedIn">',
    '',
])
assert c.count(anchor2) == 1, 'PostDetail 按钮 anchor=%d' % c.count(anchor2)
new2 = EOL.join([
    '          <button class="btn-like" :class="{ liked: post.user_liked }" @click="onLikeClick" :disabled="liking">',
    '',
])
c = c.replace(anchor2, new2)

# 2b. 添加 onLikeClick 函数（在 toggleLike 之前）
anchor3 = EOL.join([
    '// ====== 点赞/取消赞 ======',
    'async function toggleLike() {',
    '',
])
assert c.count(anchor3) == 1, 'PostDetail 函数 anchor=%d' % c.count(anchor3)
new3 = EOL.join([
    '// ====== 点赞点击（未登录/游客先提示登录） ======',
    'function onLikeClick() {',
    '  if (!isLoggedIn.value) {',
    '    // 未登录 → 跳转登录页（HR 等访客看到提示后自行登录）',
    '    router.push(\'/\')',
    '    return',
    '  }',
    '  toggleLike()',
    '}',
    '',
    '// ====== 点赞/取消赞 ======',
    'async function toggleLike() {',
    '',
])
c = c.replace(anchor3, new3)
save(p, c)
print('PostDetail.vue OK')

print('All done.')
