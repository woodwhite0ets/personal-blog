/**
 * 调酒记录（前端静态数据）
 *
 * 只记自己做过的、能复现的配方：材料、比例、做法、杯子。
 * 比例是基准，实际会按酒和口味微调；改动直接改这个文件，部署后生效。
 *
 * 字段说明
 *   slug        路由片段 /cocktails/:slug
 *   name        中文名；alias 英文名（业界通用叫法）
 *   base        基酒分类，用于筛选
 *   method      搅拌 / 摇和 / 直调
 *   glass       杯型
 *   strength    1–5 的烈度自评（5 最烈）
 *   time        出杯时间
 *   ingredients [{ name, amount }]，amount 写体积或 dash
 *   steps       按顺序的步骤
 *   notes       备注：变体、替换、常见翻车点
 *   tags        风味标签
 *   since       第一次做的时间（YYYY-MM）
 */
export const cocktails = [
  {
    slug: 'negroni',
    name: '内格罗尼',
    alias: 'Negroni',
    base: '金酒',
    method: '搅拌',
    glass: '古典杯',
    strength: 4,
    time: '3 分钟',
    tags: ['经典', '苦甜'],
    since: '2025-03',
    ingredients: [
      { name: '金酒', amount: '30 ml' },
      { name: '金巴利', amount: '30 ml' },
      { name: '甜味美思', amount: '30 ml' },
    ],
    steps: [
      '古典杯放一块大冰，先空转几圈让杯壁降温。',
      '三种酒按 1:1:1 倒进搅拌杯，加满冰。',
      '搅拌 15–20 秒，滤进古典杯。',
      '捏一片橙皮喷油，丢进杯里。',
    ],
    notes: '1:1:1 是基准。金酒换成老汤姆（Old Tom）会更圆；金巴利减到 25 ml，甜味美思补回去，苦味会收一半。',
  },
  {
    slug: 'daiquiri',
    name: '得其利',
    alias: 'Daiquiri',
    base: '朗姆',
    method: '摇和',
    glass: '鸡尾酒杯',
    strength: 3,
    time: '2 分钟',
    tags: ['清爽', '酸甜'],
    since: '2025-05',
    ingredients: [
      { name: '白朗姆', amount: '60 ml' },
      { name: '青柠汁', amount: '25 ml' },
      { name: '糖浆（1:1）', amount: '15 ml' },
    ],
    steps: [
      '青柠现挤，汁和糖浆先摇匀尝一口，酸甜平衡再往下走。',
      '全部材料加冰摇 10–12 秒。',
      '双重过滤进冰镇过的鸡尾酒杯。',
    ],
    notes: '糖浆 10–20 ml 之间按青柠的酸度调。摇到手感像稀释过的冰水，出杯温度才够低。',
  },
  {
    slug: 'old-fashioned',
    name: '古典',
    alias: 'Old Fashioned',
    base: '威士忌',
    method: '搅拌',
    glass: '古典杯',
    strength: 5,
    time: '4 分钟',
    tags: ['烈', '慢饮'],
    since: '2025-01',
    ingredients: [
      { name: '波本威士忌', amount: '60 ml' },
      { name: '糖浆（2:1）', amount: '7.5 ml' },
      { name: '安高天娜苦精', amount: '2 dash' },
    ],
    steps: [
      '糖浆和苦精先入搅拌杯，搅两下化开。',
      '加威士忌和一块大冰，搅拌 20–25 秒。',
      '滤到放了新冰块的古典杯里。',
      '橙皮在杯口喷油，擦杯沿后放入。',
    ],
    notes: '冰要够大、够干，否则五分钟就变水。想喝轻一点用黑麦（Rye），辣味更清楚。',
  },
  {
    slug: 'whiskey-sour',
    name: '威士忌酸',
    alias: 'Whiskey Sour',
    base: '威士忌',
    method: '摇和',
    glass: '古典杯',
    strength: 3,
    time: '5 分钟',
    tags: ['酸甜', '绵密'],
    since: '2025-06',
    ingredients: [
      { name: '波本威士忌', amount: '45 ml' },
      { name: '柠檬汁', amount: '20 ml' },
      { name: '糖浆（1:1）', amount: '15 ml' },
      { name: '蛋清', amount: '15 ml（可选）' },
    ],
    steps: [
      '不加冰，先把蛋清和液体干摇 10 秒，打出细密泡沫。',
      '加冰再摇 12 秒。',
      '双重过滤进古典杯，泡沫层上点三滴苦精划一道。',
    ],
    notes: '干摇（dry shake）是关键，跳过这步泡沫会粗。不加蛋清也能做，口感会薄一档。',
  },
]

export function findCocktail(slug) {
  return cocktails.find((c) => c.slug === slug) || null
}

/** 基酒分类，用来生成筛选项 */
export const bases = [...new Set(cocktails.map((c) => c.base))]
