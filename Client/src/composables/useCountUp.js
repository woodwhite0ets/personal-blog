// 读数从 0 滚到目标值（仪表自检的手感）。
// 三处共用：首屏系统状态、能力页的四格读数、（将来）任何一组静态数字。
//
// 约定：
// - 系统开了「减少动态效果」就直接落定，不做数字跳动；
// - 小数位按目标值自己判断（1.8 → 一位小数），不会出现 1.7999999；
// - rAF 被节流（后台标签页）时用定时器兜底落定，绝不把读数停在 0。
import { ref, onMounted, onUnmounted } from 'vue'

function decimalsOf(v) {
  const s = String(v)
  const i = s.indexOf('.')
  return i === -1 ? 0 : Math.min(2, s.length - i - 1)
}

export function useCountUp(targets, { duration = 700, delay = 0 } = {}) {
  const nums = targets.map((t) => Number(t) || 0)
  const dps = targets.map(decimalsOf)
  const shown = ref(targets.map(() => format(0, 0)))

  function format(value, i) {
    return dps[i] ? value.toFixed(dps[i]) : String(Math.round(value))
  }

  const settle = () => {
    shown.value = nums.map((v, i) => format(v, i))
  }

  let raf = 0
  let timer = 0

  onMounted(() => {
    if (typeof window === 'undefined') return
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (calm) { settle(); return }

    const start = () => {
      const t0 = performance.now()
      const tick = (now) => {
        const p = Math.min(1, Math.max(0, (now - t0) / duration))
        const eased = 1 - Math.pow(1 - p, 3)
        shown.value = nums.map((v, i) => format(v * eased, i))
        if (p < 1) raf = requestAnimationFrame(tick)
        else settle()
      }
      raf = requestAnimationFrame(tick)
      timer = window.setTimeout(settle, duration + 500)
    }
    timer = window.setTimeout(start, delay)
  })

  onUnmounted(() => {
    if (raf) cancelAnimationFrame(raf)
    if (timer) clearTimeout(timer)
  })

  return shown
}
