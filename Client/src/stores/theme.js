import { ref, watchEffect } from 'vue'

const THEME_KEY = 'blog-theme'
// 只留一套：浅色纸面（原 editorial 的调色板 + 衬线标题）。
// 视觉差异改由首屏底图（?art=1..6）承担，不再靠主题切换。
const THEMES = [
  { id: 'editorial', label: 'Paper', hint: '纸面' },
]

// 优先 URL ?theme=（方便分享某个主题的预览链接），其次本地记忆，最后默认 paper
const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('theme') : null
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
const initial = [fromUrl, saved].find(id => id && THEMES.some(t => t.id === id))
const current = ref(initial || THEMES[0].id)

// 主题切换平滑过渡：给 <html> 打上短暂 class，让 CSS 变量驱动颜色平滑过渡
let switchTimer = null
function applyTheme(id, init = false) {
  const el = document.documentElement
  if (!init) el.classList.add('theme-switching')
  el.setAttribute('data-theme', id)
  localStorage.setItem(THEME_KEY, id)
  clearTimeout(switchTimer)
  switchTimer = setTimeout(() => el.classList.remove('theme-switching'), 480)
}

function setTheme(id) {
  if (!THEMES.some(t => t.id === id)) return
  current.value = id
  applyTheme(id)
}

// 初始化：跟随当前值应用一次（首次不触发过渡）
let first = true
watchEffect(() => { applyTheme(current.value, first); first = false })

export function useTheme() {
  return { current, themes: THEMES, setTheme }
}
