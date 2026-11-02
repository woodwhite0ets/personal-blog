import { ref, watchEffect } from 'vue'

const THEME_KEY = 'blog-theme'
const THEMES = [
  { id: 'paper', label: 'Paper', hint: '亮色纸面' },
  { id: 'midnight', label: 'Midnight', hint: '深蓝夜色' },
  { id: 'terminal', label: 'Terminal', hint: '终端黑绿' },
  { id: 'solar', label: 'Solar', hint: '暖阳米色' },
  { id: 'editorial', label: 'Editorial', hint: '编辑排版' },
  { id: 'swiss', label: 'Swiss', hint: '瑞士网格' },
]

// 优先 URL ?theme=（方便分享某个主题的预览链接），其次本地记忆，最后默认 paper
const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('theme') : null
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
const initial = [fromUrl, saved].find(id => id && THEMES.some(t => t.id === id))
const current = ref(initial || 'paper')

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
