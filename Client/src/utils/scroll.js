// 滚动位置记忆：刷新回顶部，站内前进/后退回到上次停的位置。
// 键用 history.state.position（vue-router 给每条历史记录写的稳定序号）。
// 关键点：只在"离开页面"时记一次（路由守卫里），不要在滚动时持续覆盖 ——
// 路由切换瞬间旧组件卸载会让文档变矮、scrollY 被浏览器夹到 0，会把自己的记录冲掉。

const STORE = 'sp:scroll'
const navEntry = (typeof performance !== 'undefined' && performance.getEntriesByType)
  ? performance.getEntriesByType('navigation')[0]
  : null

// 本次进入是不是刷新
export const isReload = navEntry ? navEntry.type === 'reload' : false

function readAll() {
  try { return JSON.parse(sessionStorage.getItem(STORE) || '{}') } catch { return {} }
}

export function saveScroll(key, y) {
  if (key === undefined || key === null) return
  try {
    const map = readAll()
    map[key] = y
    sessionStorage.setItem(STORE, JSON.stringify(map))
  } catch { /* 隐私模式忽略 */ }
}

export function getScroll(key) {
  if (key === undefined || key === null) return null
  const y = readAll()[key]
  return typeof y === 'number' ? y : null
}

// 记下当前这条历史记录停在哪
export function saveCurrentPosition() {
  saveScroll(window.history.state?.position, window.scrollY)
}
