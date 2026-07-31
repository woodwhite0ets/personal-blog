import { ref, watchEffect } from 'vue'

const THEME_KEY = 'blog-theme'
const THEMES = [
  { id: 'terminal', label: 'Terminal', hint: '深色终端青' },
  { id: 'paper', label: 'Paper', hint: '亮色纸面' },
  { id: 'midnight', label: 'Midnight', hint: '深蓝夜色' },
  { id: 'solar', label: 'Solar', hint: '琥珀终端' },
]

// 恢复上次主题（默认 terminal）
const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
const current = ref(THEMES.some(t => t.id === saved) ? saved : 'terminal')

function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id)
  localStorage.setItem(THEME_KEY, id)
}

function setTheme(id) {
  if (!THEMES.some(t => t.id === id)) return
  current.value = id
  applyTheme(id)
}

// 初始化：跟随当前值应用一次
watchEffect(() => applyTheme(current.value))

export function useTheme() {
  return { current, themes: THEMES, setTheme }
}
