/**
 * 导入 TheCocktailDB 全库配方 → Client/public/cocktails.json
 *
 * 用法：node scripts/import-cocktails.mjs
 *
 * - 数据来源：https://www.thecocktaildb.com/api/json/v1/1/  （免费版需署名）
 * - 只保留做一杯需要的字段；做法优先用官方简体中文（ZH-HANS），没有就留英文
 * - 材料名做一次中文映射，没覆盖到的保留英文，方便后续补
 * - 输出体积控制在几百 KB，前端一次拉取后本地筛选/搜索
 */
import fs from 'node:fs'
import path from 'node:path'

const API = 'https://www.thecocktaildb.com/api/json/v1/1/search.php?f='
const BASE = 'https://www.thecocktaildb.com/api/json/v1/1/'
const OUT = path.join(process.cwd(), 'Client/public/cocktails.json')

// ---------- 词表 ----------
const ING = {
  'Gin': '金酒', 'Dry Gin': '干金酒', 'Sloe Gin': '黑刺李金酒', 'Old Tom Gin': '老汤姆金酒',
  'Plymouth Gin': '普利茅斯金酒', 'London dry gin': '伦敦干金酒',
  'Rum': '朗姆酒', 'Light rum': '白朗姆', 'White rum': '白朗姆', 'Dark rum': '黑朗姆',
  'Gold rum': '金朗姆', 'Aged rum': '陈年朗姆', 'Spiced rum': '香料朗姆', 'Rumple Minze': '薄荷利口酒',
  'Bacardi': '百加得', 'Malibu rum': '马利宝椰子朗姆',
  'Vodka': '伏特加', 'Absolut Vodka': '绝对伏特加', 'Smirnoff': '斯米诺伏特加',
  'Whiskey': '威士忌', 'Whisky': '威士忌', 'Bourbon': '波本威士忌', 'Rye whiskey': '黑麦威士忌',
  'Scotch': '苏格兰威士忌', 'Blended whiskey': '调和威士忌', 'Irish Whiskey': '爱尔兰威士忌',
  'Tequila': '龙舌兰', 'Blanco tequila': '银龙舌兰', 'Reposado tequila': '微陈龙舌兰',
  'Mezcal': '梅斯卡尔', 'Brandy': '白兰地', 'Cognac': '干邑', 'Pisco': '皮斯科',
  'Triple sec': '橙皮甜酒', 'Cointreau': '君度', 'Grand Marnier': '柑曼怡',
  'Campari': '金巴利', 'Aperol': '阿佩罗', 'Sweet Vermouth': '甜味美思', 'Dry Vermouth': '干味美思',
  'Vermouth': '味美思', 'Lillet Blanc': '利莱白', 'Maraschino Liqueur': '黑樱桃利口酒',
  'Orange bitters': '橙味苦精', 'Bitters': '苦精', 'Angostura bitters': '安高天娜苦精',
  'Peychaud bitters': '佩肖苦精', 'Absinthe': '苦艾酒', 'Chartreuse': '荨麻酒',
  'Yellow Chartreuse': '黄荨麻酒', 'Green Chartreuse': '绿荨麻酒',
  'Kahlua': '甘露咖啡利口酒', 'Baileys irish cream': '百利甜酒', 'Amaretto': '杏仁利口酒',
  'Chambord raspberry liqueur': '香波覆盆子利口酒', 'Frangelico': '榛子利口酒',
  'Lemon juice': '柠檬汁', 'Lime juice': '青柠汁', 'Lime': '青柠', 'Lemon': '柠檬',
  'Orange juice': '橙汁', 'Grapefruit juice': '西柚汁', 'Pineapple juice': '菠萝汁',
  'Cranberry juice': '蔓越莓汁', 'Tomato juice': '番茄汁', 'Apple juice': '苹果汁',
  'Coconut milk': '椰奶', 'Cream': '淡奶油', 'Milk': '牛奶', 'Heavy cream': '淡奶油',
  'Sugar': '糖', 'Sugar syrup': '糖浆', 'Simple syrup': '糖浆', 'Powdered sugar': '糖粉',
  'Honey': '蜂蜜', 'Honey syrup': '蜂蜜糖浆', 'Grenadine': '红石榴糖浆',
  'Egg': '鸡蛋', 'Egg white': '蛋清', 'Egg yolk': '蛋黄',
  'Soda water': '苏打水', 'Club soda': '苏打水', 'Carbonated water': '气泡水',
  'Tonic water': '汤力水', 'Ginger ale': '姜汁汽水', 'Ginger beer': '姜啤',
  'Cola': '可乐', 'Sprite': '雪碧', '7-Up': '七喜',
  'Water': '水', 'Ice': '冰块', 'Crushed ice': '碎冰',
  'Mint': '薄荷', 'Basil': '罗勒', 'Rosemary': '迷迭香', 'Thyme': '百里香',
  'Olive': '橄榄', 'Celery': '芹菜', 'Cucumber': '黄瓜', 'Salt': '盐', 'Pepper': '胡椒',
  'Cinnamon': '肉桂', 'Cloves': '丁香', 'Nutmeg': '肉豆蔻', 'Coffee': '咖啡',
  'Espresso': '浓缩咖啡', 'Chocolate': '巧克力', 'Chocolate syrup': '巧克力糖浆',
  'Vanilla extract': '香草精', 'Whipped cream': '打发奶油', 'Ice cream': '冰淇淋',
  'Orange': '橙子', 'Orange peel': '橙皮', 'Lemon peel': '柠檬皮', 'Lime peel': '青柠皮',
  'Cherry': '樱桃', 'Maraschino cherry': '马拉斯奇诺樱桃', 'Strawberries': '草莓',
  'Raspberry': '覆盆子', 'Blackberries': '黑莓', 'Blueberries': '蓝莓',
  'Pineapple': '菠萝', 'Banana': '香蕉', 'Peach': '桃子', 'Apple': '苹果',
  'Prosecco': '普罗塞克', 'Champagne': '香槟', 'Red wine': '红葡萄酒', 'White wine': '白葡萄酒',
  'Beer': '啤酒', 'Apple cider': '苹果酒',
  'Peach schnapps': '桃子利口酒', 'Butterscotch schnapps': '奶油糖果利口酒',
  'Blue Curacao': '蓝橙酒', 'Curaçao': '橙皮酒', 'Midori melon liqueur': '蜜多丽蜜瓜利口酒',
  'Coconut rum': '椰子朗姆', 'Pink lemonade': '粉红柠檬水', 'Lemonade': '柠檬水',
  'Cream of coconut': '椰浆', 'Condensed milk': '炼乳', 'Almond milk': '杏仁奶',
  'Maple syrup': '枫糖浆', 'Agave syrup': '龙舌兰糖浆', 'Agave nectar': '龙舌兰糖浆',
  'Tabasco sauce': '塔巴斯科辣酱', 'Worcestershire sauce': '伍斯特酱',
  'Hot sauce': '辣酱', 'Soy sauce': '酱油', 'Miso': '味噌', 'Wasabi': '芥末',
  'Drambuie': '杜林标', 'Galliano': '加利安奴', 'Sambuca': '珊布卡',
  'Tia maria': '提亚玛丽亚', 'Southern Comfort': '南方安逸', 'Curacao': '橙皮酒',
  'Apple brandy': '苹果白兰地', 'Calvados': '卡尔瓦多斯', 'Apricot brandy': '杏子白兰地',
  'Cherry brandy': '樱桃白兰地', 'Blackberry brandy': '黑莓白兰地',
  'Club mate': '玛黛汽水', 'Energy drink': '能量饮料', 'Tea': '茶', 'Green tea': '绿茶',
  'Yoghurt': '酸奶', 'Falernum': '法勒南糖浆', 'Orgeat syrup': '杏仁糖浆',
  'Rose water': '玫瑰水', 'Vanilla': '香草', 'Lavender': '薰衣草',
  /* —— 按导入后出现频次补的词条（占比最高的那些） —— */
  '151 proof rum': '高度朗姆（151）', 'Coca-Cola': '可乐', 'Pepsi Cola': '百事可乐',
  'Light cream': '淡奶油', 'Sweet and sour': '酸甜汁', 'Sour mix': '酸甜预调汁',
  'Creme de Cassis': '黑加仑利口酒', 'Creme de Cacao': '可可利口酒', 'Dark Creme de Cacao': '深色可可利口酒',
  'Lager': '拉格啤酒', 'Ale': '艾尔啤酒', 'Guinness stout': '健力士黑啤', 'Corona': '科罗娜',
  'Lemon-lime soda': '柠檬汽水', 'Root beer': '根汁汽水', 'Mountain Dew': '激浪', 'Surge': 'Surge 汽水', 'Zima': 'Zima',
  'Cocoa powder': '可可粉', 'Port': '波特酒', 'Sherry': '雪莉酒', 'Cider': '苹果酒',
  'Elderflower cordial': '接骨木花糖浆', 'Passion fruit juice': '百香果汁', 'Grapefruit Juice': '西柚汁',
  'Cranberry Juice': '蔓越莓汁', 'Pineapple Juice': '菠萝汁', 'Grape juice': '葡萄汁',
  'Jack Daniels': '杰克丹尼', 'Jim Beam': '占边威士忌', 'Wild Turkey': '野火鸡威士忌', 'Crown Royal': '皇冠威士忌', 'Johnnie Walker': '尊尼获加',
  'Absolut Citron': '绝对柠檬伏特加', 'Bacardi Limon': '百加得柠檬', 'Peach Vodka': '桃子伏特加', 'Vanilla vodka': '香草伏特加',
  'Gold tequila': '金龙舌兰', 'Cachaca': '卡莎萨', 'Applejack': '苹果杰克', 'Everclear': '生命之水',
  'Benedictine': '廊酒', 'Goldschlager': '金箔肉桂酒', 'Jägermeister': '野格', 'Passoa': '百香果利口酒',
  'Coconut Liqueur': '椰子利口酒', 'Coffee liqueur': '咖啡利口酒', 'Banana Liqueur': '香蕉利口酒',
  'Irish cream': '爱尔兰奶油利口酒', 'Cherry Heering': '樱桃喜龄酒', 'Chocolate liqueur': '巧克力利口酒',
  'White Creme de Menthe': '白薄荷利口酒', 'Green Creme de Menthe': '绿薄荷利口酒', 'Creme de Mure': '黑莓利口酒',
  'Strawberry schnapps': '草莓利口酒', 'Blueberry schnapps': '蓝莓利口酒', 'Apple Schnapps': '苹果利口酒',
  'Strawberry liqueur': '草莓利口酒', 'Pisang Ambon': '香蕉利口酒', 'Hpnotiq': 'Hpnotiq', 'Ricard': '里卡尔茴香酒',
  'Anis': '茴香酒', 'Wormwood': '苦艾', 'Hot Damn': 'Hot Damn 肉桂酒', 'Peach Bitters': '桃子苦精',
  'Orange spiral': '橙皮螺旋', 'Half-and-half': '半奶半奶油', 'Whipping cream': '打发奶油',
  'Vanilla ice-cream': '香草冰淇淋', 'Sherbet': '雪葩', 'Fruit': '水果', 'Fruit punch': '水果潘趣',
  'Kiwi': '猕猴桃', 'Mango': '芒果', 'Cardamom': '小豆蔻', 'Brown sugar': '红糖',
  'Iced tea': '冰红茶', 'Hot chocolate': '热巧克力', 'Peach nectar': '桃子果浆',
  'Schweppes Russchian': '怡泉粉红汤力', 'Kool-Aid': '果味冲剂',
  'Rosemary Syrup': '迷迭香糖浆', 'Raspberry syrup': '覆盆子糖浆', 'Roses sweetened lime juice': '青柠糖浆',
  'Lime juice cordial': '青柠糖浆', 'Fresh Lime Juice': '鲜青柠汁', 'Fresh Lemon Juice': '鲜柠檬汁',
  'Orange Bitters': '橙味苦精',
}

// 常见酒名的中文译名（不在表里的保留英文原名）
const NAME_ZH = {
  'Mojito': '莫吉托', 'Margarita': '玛格丽特', 'Cosmopolitan': '大都会', 'Long Island Tea': '长岛冰茶',
  'Manhattan': '曼哈顿', 'Martini': '马天尼', 'Dry Martini': '干马天尼', 'Daiquiri': '得其利',
  'Negroni': '内格罗尼', 'Old Fashioned': '古典', 'Whiskey Sour': '威士忌酸', 'Bloody Mary': '血腥玛丽',
  'Pina Colada': '椰林飘香', 'Piña Colada': '椰林飘香', 'Mai Tai': '迈泰', 'Tequila Sunrise': '龙舌兰日出',
  'Sex on the Beach': '性感沙滩', 'Screwdriver': '螺丝起子', 'Gin Tonic': '金汤力', 'Gin and Tonic': '金汤力',
  'Moscow Mule': '莫斯科骡子', 'Espresso Martini': '浓缩咖啡马天尼', 'Aperol Spritz': '阿佩罗气泡',
  'Spritz': '气泡酒', 'Paloma': '帕洛玛', 'Sidecar': '边车', 'White Russian': '白俄罗斯',
  'Black Russian': '黑俄罗斯', 'Caipirinha': '卡皮里尼亚', 'Cuba Libre': '自由古巴', 'Americano': '美国佬',
  'Boulevardier': '花花公子', 'Last Word': '遗言', 'Aviation': '航空', 'Clover Club': '三叶草俱乐部',
  'French 75': '法兰西 75', 'Gimlet': '吉姆雷特', 'Tom Collins': '汤姆柯林斯', 'John Collins': '约翰柯林斯',
  'Singapore Sling': '新加坡司令', 'Zombie': '僵尸', 'Hurricane': '飓风', 'Blue Lagoon': '蓝色泻湖',
  'Bellini': '贝里尼', 'Mimosa': '含羞草', 'Kir Royale': '皇家基尔', 'Sazerac': '萨泽拉克',
  'Corpse Reviver': '还魂', 'Penicillin': '盘尼西林', 'Dark and Stormy': '暗黑风暴', 'Irish Coffee': '爱尔兰咖啡',
  'Whiskey Sour': '威士忌酸', 'Amaretto Sour': '杏仁酸', 'Pisco Sour': '皮斯科酸', 'Gin Fizz': '金菲士',
  'Ramos Gin Fizz': '拉莫斯金菲士', 'Mint Julep': '薄荷茱莉普', 'Rob Roy': '罗伯罗伊', 'Vesper': '维斯帕',
  'Alexander': '亚历山大', 'Grasshopper': '蚱蜢', 'B-52': 'B-52', 'Kamikaze': '神风特攻',
}
const GLASS = {
  'Cocktail glass': '鸡尾酒杯', 'Martini Glass': '马天尼杯', 'Old-fashioned glass': '古典杯',
  'Highball glass': '高球杯', 'Collins glass': '柯林杯', 'Shot glass': '烈酒杯',
  'Champagne flute': '香槟杯', 'Wine Glass': '葡萄酒杯', 'Margarita glass': '玛格丽特杯',
  'Margarita/Coupette glass': '玛格丽特杯', 'Hurricane glass': '飓风杯',
  'Pint glass': '品脱杯', 'Beer mug': '啤酒马克杯', 'Coffee mug': '咖啡杯',
  'Irish coffee cup': '爱尔兰咖啡杯', 'Punch bowl': '潘趣碗', 'Pitcher': '大壶',
  'Copper Mug': '铜杯', 'Mason jar': '梅森罐', 'Coupe Glass': '碟形杯',
  'Balloon Glass': '气球杯', 'Beer Glass': '啤酒杯', 'Whiskey sour glass': '酸酒杯',
  'Cordial glass': '利口酒杯', 'Nick and Nora Glass': '尼克诺拉杯',
  'Brandy snifter': '白兰地杯', 'Jar': '罐', 'Pousse cafe glass': '分层杯',
  'White wine glass': '白葡萄酒杯', 'Beer pilsner': '皮尔森杯', 'Whiskey Glass': '威士忌杯',
}
const GLASS_LC = Object.fromEntries(Object.entries(GLASS).map(([k, v]) => [k.toLowerCase(), v]))
// 分类是界面文案，也一起译掉
const CATEGORY = {
  'Cocktail': '鸡尾酒', 'Shot': '烈酒小杯', 'Ordinary Drink': '日常饮品', 'Beer': '啤酒',
  'Punch / Party Drink': '潘趣 / 派对', 'Coffee / Tea': '咖啡茶饮', 'Soft Drink': '软饮',
  'Other / Unknown': '其他', 'Homemade Liqueur': '自制利口酒', 'Shake': '奶昔', 'Cocoa': '可可',
}

// 基酒识别按顺序取第一个命中：烈酒在前，酒类兜底（避免 "Ginger Beer" 抢走朗姆）
const BASES = [
  ['金酒', /\bgin\b|genever|sloe/i],
  ['朗姆', /\brum\b|cachaca|demerara/i],
  ['威士忌', /whisk|bourbon|scotch|\brye\b|jack daniel|jameson/i],
  ['龙舌兰', /tequila|mezcal/i],
  ['伏特加', /vodka/i],
  ['白兰地', /brandy|cognac|armagnac|pisco|calvados/i],
  ['利口酒', /liqueur|schnapps|vermouth|curacao|amaretto|kahlua|cointreau|triple sec|chartreuse|creme de|crème|sambuca|baileys|irish cream|drambuie/i],
  ['葡萄酒', /wine|champagne|prosecco|cava|sherry|port|sake|\bale\b|lager|stout|cider|beer/i],
]

// 大小写 / 空格差异太多（"Lime Juice" vs "Lime juice"），统一按小写查
const ING_LC = Object.fromEntries(Object.entries(ING).map(([k, v]) => [k.toLowerCase(), v]))
const zhIng = (name) => {
  const key = String(name || '').trim().toLowerCase()
  return ING_LC[key] || String(name || '').trim()
}
const zhGlass = (g) => GLASS_LC[String(g || '').trim().toLowerCase()] || g || ''
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60)
// 基酒要在翻译前用原始英文名判断，否则 "金酒" 命不中 /gin/
const detectBase = (rawNames) => {
  for (const [label, re] of BASES) if (rawNames.some((i) => re.test(i))) return label
  return '无酒精'
}
const detectMethod = (text) => {
  const t = (text || '').toLowerCase()
  if (/blend|blender/.test(t)) return '搅打'
  if (/shake|shaker/.test(t)) return '摇和'
  if (/stir/.test(t)) return '搅拌'
  if (/build|pour|layer/.test(t)) return '直调'
  return '直调'
}
const splitSteps = (text) => String(text || '')
  .split(/(?<=[。！？.!?])\s*/)
  .map((s) => s.trim())
  .filter((s) => s.length > 1)
  .slice(0, 8)

async function get(letter) {
  const res = await fetch(API + encodeURIComponent(letter))
  if (!res.ok) return []
  const json = await res.json()
  return json.drinks || []
}

// 接口偶尔返回空 / 429，重试两次，避免每次跑出来的条数不一样
const withRetry = async (fn, tries = 3) => {
  for (let i = 0; i < tries; i++) {
    const r = await fn()
    if (r) return r
    await new Promise((res) => setTimeout(res, 300 * (i + 1)))
  }
  return null
}

// 字母搜索每个字母只回 25 条；分类 / 杯型 / 酒精度数三种过滤能补全剩下的
async function listIds(url) {
  const ids = await withRetry(async () => {
    try {
      const res = await fetch(url)
      if (!res.ok) return null
      const json = await res.json()
      const list = (json.drinks || []).map((d) => String(d.idDrink))
      return list.length ? list : null
    } catch { return null }
  })
  return ids || []
}

async function lookup(id) {
  return withRetry(async () => {
    try {
      const res = await fetch(BASE + 'lookup.php?i=' + id)
      const json = await res.json()
      return (json.drinks || [])[0] || null
    } catch { return null }
  })
}

const letters = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9']
const raw = []
for (const l of letters) {
  const list = await get(l)
  raw.push(...list)
  process.stdout.write(`${l}:${list.length} `)
}

const CATS = ['Beer','Cocktail','Cocoa','Coffee / Tea','Homemade Liqueur','Ordinary Drink','Other / Unknown','Punch / Party Drink','Shake','Shot','Soft Drink']
const GLASSES = ['Cocktail glass','Martini Glass','Old-fashioned glass','Highball glass','Collins glass','Shot glass','Champagne flute','Wine Glass','Margarita glass','Hurricane glass','Pint glass','Beer mug','Coffee mug','Irish coffee cup','Punch bowl','Pitcher','Copper Mug','Mason jar','Coupe Glass','Balloon Glass','Beer Glass','Whiskey sour glass','Cordial glass','Nick and Nora Glass','Brandy snifter','Jar','Pousse cafe glass']
const ALC = ['Alcoholic','Non_Alcoholic','Optional_alcohol']
// 反复收集直到候选集合不再增长：接口每次返回的截断位置不一样，跑两三轮才能收全
const have = new Set(raw.map((d) => String(d.idDrink)))
for (let pass = 0; pass < 6; pass++) {
  const idSet = new Set()
  for (const c of CATS) (await listIds(BASE + 'filter.php?c=' + encodeURIComponent(c))).forEach((id) => idSet.add(id))
  for (const g of GLASSES) (await listIds(BASE + 'filter.php?g=' + encodeURIComponent(g))).forEach((id) => idSet.add(id))
  for (const a of ALC) (await listIds(BASE + 'filter.php?a=' + a)).forEach((id) => idSet.add(id))

  const missing = [...idSet].filter((id) => !have.has(id))
  console.log(`第 ${pass + 1} 轮：候选 ${idSet.size}，已有 ${have.size}，补 ${missing.length}`)
  if (!missing.length) break
  for (let i = 0; i < missing.length; i += 8) {
    const got = await Promise.all(missing.slice(i, i + 8).map((id) => lookup(id)))
    got.forEach((d) => {
      if (!d) return
      have.add(String(d.idDrink))
      raw.push(d)
    })
    process.stdout.write('.')
  }
}
console.log(`\n合计 ${raw.length} 条（含重复）`)

const seen = new Set()
const drinks = []
for (const d of raw) {
  const slug = slugify(d.strDrink || '')
  if (!slug || seen.has(slug)) continue
  seen.add(slug)

  const ingredients = []
  const rawNames = []
  for (let i = 1; i <= 15; i++) {
    const name = d[`strIngredient${i}`]
    if (!name || !String(name).trim()) continue
    const measure = (d[`strMeasure${i}`] || '').trim()
    rawNames.push(String(name).trim())
    ingredients.push([zhIng(String(name).trim()), measure])
  }
  if (!ingredients.length) continue

  const zh = (d['strInstructionsZH-HANS'] || '').trim()
  const en = (d.strInstructions || '').trim()
  const steps = splitSteps(zh || en)
  if (!steps.length) continue

  const tags = []
  if (d.strIBA) tags.push('IBA')
  if ((d.strTags || '').toLowerCase().includes('classic')) tags.push('经典')
  if (d.strCategory) tags.push(CATEGORY[d.strCategory] || d.strCategory)
  if (d.strAlcoholic === 'Non alcoholic') tags.push('无酒精')

  drinks.push({
    slug,
    name: d.strDrink,
    nameZh: NAME_ZH[d.strDrink] || '',
    base: detectBase(rawNames),
    method: detectMethod(en),
    glass: zhGlass(d.strGlass),
    alcoholic: d.strAlcoholic === 'Non alcoholic' ? '无酒精' : '含酒精',
    tags: [...new Set(tags)].slice(0, 4),
    ingredients,
    steps,
    zh: !!zh,
  })
}

drinks.sort((a, b) => a.name.localeCompare(b.name))
const payload = {
  source: 'TheCocktailDB',
  updated: new Date().toISOString().slice(0, 10),
  count: drinks.length,
  drinks,
}
fs.writeFileSync(OUT, JSON.stringify(payload))
const kb = (fs.statSync(OUT).size / 1024).toFixed(0)
console.log(`写入 ${OUT}：${drinks.length} 杯，${kb} KB`)
console.log(`中文做法覆盖：${drinks.filter((d) => d.zh).length} / ${drinks.length}`)
console.log(`材料未翻译：${[...new Set(drinks.flatMap((d) => d.ingredients.map((i) => i[0])).filter((n) => /[a-z]/i.test(n)))].length} 个`)
