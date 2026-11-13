/**
 * 初创版官网（/business/startup）的价格与条款 —— 唯一真源。
 *
 * 商业方案在 /data/work/mubai/business/website-service-plan-2026-11-11.md，
 * 这里的数字必须和那份一致；改价改这里，别在页面上写死。
 *
 * 对外只挂「单页 699 起 / 完整 1,299 起」两档；在校创办的公司另有价目（暗线），
 * 页面上只说「另有价目」，不出现数字。
 */

export const startupTiers = [
  {
    name: '单页',
    fit: '产品不多，先要一个能发出去的地址',
    includes: '定位、产品墙（≤6 个）、联系，一页搞定。三套配色选一套。',
    revisions: '1 轮',
    source: '不含源码',
    from: '699 起',
    lead: '5 个工作日',
  },
  {
    name: '完整',
    fit: '有三四个产品，每个都要说清楚',
    includes: '首页、每个产品一页、关于、联系。可选中英双语。',
    revisions: '2 轮',
    source: '含源码',
    from: '1,299 起',
    lead: '10 个工作日',
  },
]

export const startupAddons = [
  { name: '加急', price: '+50%', note: '三个工作日内交付' },
  { name: '文案代写', price: '200/页', note: '按页面写，不代定方向' },
  { name: '图片精修', price: '50/张', note: '客户提供原图' },
  { name: '加页面', price: '300/页', note: '沿用同一套版式' },
  { name: '完整档加英文', price: '+400', note: '中英双语，共用一套版式' },
]

export const carePlan = {
  name: '运维年费',
  price: '199',
  studentPrice: '149',
  renew: '次年 149 / 在校 99',
  includes: '一年 8 次内容修改（改字、换图、换链接、换电话）、挂机排查恢复、域名与平台续费提醒',
  excludes: '改版式、换配色、加页面、加功能 —— 一律另报',
  over: '超出次数按 50 元/次',
  note: '不做月付。交付后 30 天保修期满才推，两者不重叠。',
}

/**
 * 随单赠送的 token 代金券（2026-11-13 加入）。
 *
 * 面额**还没定**（2026-11-13 博士：先不给具体金额）。所以 amounts 留空，
 * 页面上只写「面额按档位定，下单时确认」。等定价确定后，把 amounts 填成
 *   [{ tier: '单页', value: '¥100' }, { tier: '完整', value: '¥300' }]
 * 金额那一排就会自动出现，不用改模板。
 */
export const tokenVoucher = {
  label: '随单赠送 · AI TOKEN',
  amounts: [],
  amountsNote: '面额按档位定，下单时确认',
  usable: '可用于木白提供的模型接口与本地推理服务，按实际调用的单价扣减',
  terms: '有效期与使用规则以券面为准；不兑现、不找零、不转让，可与页面上的折扣叠加',
  why: '站上线之后总要接 AI 功能，第一笔调用费我们出。',
}

export const startupDiscounts = [
  { name: '案例授权', value: '−100', note: '允许公开域名与 logo' },
  { name: '推荐同学成单', value: '−150/单', note: '最多 2 单' },
  { name: '转定制或诊断', value: '全额抵扣', note: '建站费可抵 1,200 诊断或 3 万起定制' },
]

export const startupNotes = {
  notIncluded: '域名费、服务器费、备案代办、文案撰写、产品图拍摄、接 CMS/支付/公众号/CRM、SEO 代运营，都不在报价里。',
  acceptance: '预览发出后 3 个工作日无异议，视为通过。',
  hiddenStudent: '在校创办的公司另有价目，写信时说明一下在校身份即可。',
  beat: '每周三、周五各集中发布一批；日常沟通集中在晚上一个时段，不随时交。',
}
