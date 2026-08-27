# -*- coding: utf-8 -*-
# 修复：未登录时页头显示"登录"按钮
import io

def load(p):
    with io.open(p, 'r', encoding='utf-8', newline='') as f:
        return f.read()

def save(p, content):
    with io.open(p, 'w', encoding='utf-8', newline='') as f:
        f.write(content)

BASE = r'C:\Users\19037\Desktop\Blog\Client\src\components\Homepage'
EOL = '\r\n'

# 未登录模板：新文章按钮旁加登录按钮
old = EOL.join([
    '          <!-- 未登录 -->',
    '          <template v-if="!isLoggedIn">',
    '            <router-link to="/login" class="btn-write">',
    '              <span class="btn-write-icon">+</span> 新文章',
    '            </router-link>',
    '          </template>',
])
new = EOL.join([
    '          <!-- 未登录 -->',
    '          <template v-if="!isLoggedIn">',
    '            <router-link to="/login" class="btn-login-nav">登录</router-link>',
    '            <router-link to="/login" class="btn-write">',
    '              <span class="btn-write-icon">+</span> 新文章',
    '            </router-link>',
    '          </template>',
])

for fname in ['Homepage.vue', 'ForumPage.vue']:
    p = BASE + '\\' + fname
    c = load(p)
    assert c.count(old) == 1, '%s anchor=%d' % (fname, c.count(old))
    c = c.replace(old, new)
    save(p, c)
    print(fname + ' 模板 OK')

# 样式：加 btn-login-nav 样式（跟随现有按钮风格）
style_anchor = '.btn-write {'
for fname in ['Homepage.vue', 'ForumPage.vue']:
    p = BASE + '\\' + fname
    c = load(p)
    if c.count(style_anchor) == 0:
        print('%s 无 .btn-write 样式，跳过' % fname)
        continue
    style = EOL.join([
        '.btn-login-nav {',
        '  padding: 7px 18px; font-size: 13px; font-weight: 600;',
        '  color: var(--accent); background: var(--accent-a8);',
        '  border: 1px solid var(--accent-a20); border-radius: 6px;',
        '  text-decoration: none; transition: all 0.2s;',
        '}',
        '.btn-login-nav:hover { background: var(--accent-a15); border-color: var(--accent-a30); }',
        '',
    ])
    c = c.replace(style_anchor, style + style_anchor, 1)
    save(p, c)
    print(fname + ' 样式 OK')

print('All done.')
