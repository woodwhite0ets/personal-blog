// ====== 违禁词过滤（注册用户名/昵称/简介） ======
// 中文直接子串匹配；英文用较长词避免误伤（如避免用 ass 匹配 class/pass）

const BANNED_WORDS = [
  // ===== 中文辱骂/挑衅 =====
  '傻逼', '傻b', '傻屄', '煞笔', '傻比', '沙比', '撒比', '傻笔',
  '白痴', '智障', '弱智', '脑残', '脑瘫',
  '贱人', '贱货', '婊子', '骚货', '娼妇',
  '草泥马', '操你妈', '日你妈', '去你妈', '你妈逼', '他妈逼', '卧槽尼玛',
  '狗逼', '狗日的', '狗娘', '王八蛋', '狗杂种',
  '憨憨', '憨批', '憨b',
  '废物', '蠢货', '蠢逼', '蠢猪', '傻狗',
  '妈逼', '你麻痹', '尼玛逼', '去死', '你妈死',
  '死妈', '死全家', '全家死', '祖宗十八代',
  '杂种', '野种', '畜生', '禽兽', '龟儿子',
  '变态', '恶心', '垃圾人', '人渣',
  // ===== 英文辱骂（转小写后子串匹配） =====
  'fuck', 'fucking', 'fucker',
  'shit', 'bullshit', 'shitty',
  'bitch', 'bitchy',
  'asshole', 'asshat', 'asswipe',
  'cunt', 'pussy',
  'dickhead', 'motherfucker',
  'whore', 'slut', 'slutty',
  'bastard', 'nigga', 'nigger', 'faggot',
  'dumbass', 'moron',
];

// 检查文本是否包含违禁词
function containsBannedWord(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

module.exports = { containsBannedWord };
