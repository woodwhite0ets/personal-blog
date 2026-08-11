# -*- coding: utf-8 -*-
# 加固 posts.js 的 sanitizeContent / sanitizeText：剥离数字字符引用（防实体混淆 XSS）
import io

p = r'C:\Users\19037\Desktop\Blog\Server\src\routes\posts.js'
with io.open(p, 'r', encoding='utf-8', newline='') as f:
    content = f.read()

EOL = '\r\n' if '\r\n' in content else '\n'
print('EOL:', repr(EOL), 'CRLF count:', content.count('\r\n'))

# --- 1. sanitizeText：尖括号剥离后加实体剥离 ---
anchor1 = "    .replace(/[<>]/g, '')          // 去除残留尖括号" + EOL
add1 = "    .replace(/&#(?:x[0-9a-fA-F]{1,6}|[0-9]{1,7});/gi, '')   // 剥离数字字符引用（防实体混淆）" + EOL
assert content.count(anchor1) == 1, 'anchor1 count=%d' % content.count(anchor1)
content = content.replace(anchor1, anchor1 + add1)

# --- 2. sanitizeContent：控制字符剥离后、危险标签剥离前，加实体剥离 ---
anchor2 = "    .replace(/[\\x01-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '')" + EOL
add2 = ("    // 剥离数字字符引用（&#61; / &#x61;），防实体混淆的 XSS（如 jav&#x61;script:、<scr&#105;pt>）" + EOL +
        "    .replace(/&#(?:x[0-9a-fA-F]{1,6}|[0-9]{1,7});/gi, '')" + EOL)
assert content.count(anchor2) == 1, 'anchor2 count=%d' % content.count(anchor2)
content = content.replace(anchor2, anchor2 + add2)

# --- 3. sanitizeContent：data URI 图片剥离后，加 data: 协议链接剥离 ---
anchor3 = "    .replace(/!\\[([^\\]]*)\\]\\(data:[^)]+\\)/g, '![$1](uploading...)')" + EOL
add3 = ("    // 剥离 data: 协议链接（图片内嵌 data URI 已在上方保留）" + EOL +
        "    .replace(/\\[([^\\]]*)\\]\\(data:[^)]*\\)/g, '[$1](blocked:)')" + EOL)
assert content.count(anchor3) == 1, 'anchor3 count=%d' % content.count(anchor3)
content = content.replace(anchor3, anchor3 + add3)

with io.open(p, 'w', encoding='utf-8', newline='') as f:
    f.write(content)

print('Done. New CRLF count:', content.count('\r\n'))
