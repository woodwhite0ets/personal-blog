<template>
  <div class="co-deck" ref="rootEl">
    <div class="co-deck-track">
      <slot />
    </div>

    <!-- 右侧活页索引：当前页实心，滑块自己滑到位置 -->
    <nav class="co-deck-index" :class="{ 'is-tail': atTail }" aria-label="首页分屏">
      <span class="co-deck-rail" aria-hidden="true">
        <span class="co-deck-rail-fill" :style="{ '--n': Math.max(screens.length, 1), '--i': active }"></span>
      </span>
      <ol>
        <li v-for="(s, i) in screens" :key="s.id">
          <a
            :href="`#${s.id}`"
            :class="{ 'is-on': i === active }"
            :aria-current="i === active ? 'true' : undefined"
            @click.prevent="goScreen(i)"
          >
            <span class="co-deck-n">{{ s.no }}</span>
            <span class="co-deck-t">{{ s.label }}</span>
          </a>
        </li>
      </ol>
    </nav>

    <p class="co-deck-hint" :class="{ 'is-off': active >= screens.length - 1, 'is-gone': atTail }" aria-hidden="true">
      <span>{{ active >= screens.length - 1 ? 'END' : 'SCROLL' }}</span><i></i>
    </p>
  </div>
</template>

<script setup>
/* 一屏一段的活页（deck）
   ------------------------------------------------------------
   桌面（宽 ≥940 且高 ≥700）把整页切成按屏吸附：滚轮一格＝一屏，
   靠原生 scroll-snap + scroll-snap-stop: always 实现，不手写滚轮累计，
   所以触控板、触摸、键盘、拖动滚动条都是同一套手感，也不会和浏览器抢事件。
   窄屏、矮屏、开了「减少动态效果」时整套吸附关掉，退回普通长页滚动。

   JS 只做三件事：切启用条件、算当前页、页码栏跳转与键盘。
   屏内的出场动画由 CSS 的 :target / .is-in 驱动，见 company.css 的 DECK 段。 */
import { ref, onMounted, onUnmounted } from 'vue'

const rootEl = ref(null)
const screens = ref([])
const active = ref(0)
// 页脚是最后一「翻」：它自己占满一屏，翻到它时收起索引栏
const tailEl = ref(null)
const atTail = ref(false)

let io = null
let artIo = null
let mq = null
// 屏 → 离场计时器（重播用）
const liveTimers = new Map()
let mqHandler = null
let rmq = null
let rmqHandler = null

const QUERY = '(min-width: 940px) and (min-height: 700px)'
const ROOT = document.documentElement

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function collect() {
  tailEl.value = document.querySelector('.co-page .co-foot')
  const nodes = Array.from(rootEl.value?.querySelectorAll('[data-screen]') || [])
  screens.value = nodes.map((el, i) => ({
    el,
    id: el.id || `screen-${i + 1}`,
    label: el.dataset.label || '',
    no: el.dataset.no || String(i + 1).padStart(2, '0'),
  }))
}

function sync() {
  const on = mq ? mq.matches && !reduced() : false
  ROOT.classList.toggle('is-deck', on)
  // 关掉吸附时把当前页对应的屏放出来，避免内容停留在隐藏态
  if (!on) screens.value.forEach(({ el }) => el.classList.add('is-live'))
}

/* 图案上膛：进入视口上下各 1.2 屏范围才真正取图，首屏不必等七张图 */
function observeArt() {
  if (artIo) artIo.disconnect()
  const nodes = screens.value.map((s) => s.el)
  if (tailEl.value) nodes.push(tailEl.value)
  if (typeof IntersectionObserver === 'undefined') {
    nodes.forEach((el) => el.classList.add('is-armed'))
    return
  }
  artIo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('is-armed')
    })
  }, { rootMargin: '60% 0px 60% 0px' })
  nodes.forEach((el) => {
    // 第一屏（含首屏）立刻上膛，别等观察器
    if (el === screens.value[0]?.el) el.classList.add('is-armed')
    artIo.observe(el)
  })
}

function observe() {
  if (io) io.disconnect()
  if (typeof IntersectionObserver === 'undefined') {
    // 没有观察器时不能留一屏空白：直接把所有屏放出来
    screens.value.forEach(({ el }) => el.classList.add('is-live'))
    return
  }
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const i = screens.value.findIndex((s) => s.el === e.target)
        if (i < 0) return
        // 屏过半即算到达；同时放出这一屏的出场
        if (e.isIntersecting) {
          // 回来时重新演一遍：先取消离场计时，再补上 is-live
          clearTimeout(liveTimers.get(e.target))
          liveTimers.delete(e.target)
          e.target.classList.add('is-live')
          // 到达的屏直接放出来：观察器的阈值偶尔会漏（快速拖动滚动条、屏高刚等于视口）
          if (e.intersectionRatio >= 0.5) {
            active.value = i
            e.target.classList.add('is-live')
          }
        } else {
          // 完全离开视口 280ms 后再摘：留出回滚/连滚的余量，摘的时候屏已在画面外，
          // 不会看到「内容突然消失」；下次翻回来 is-live 重新加上，动效重播。
          clearTimeout(liveTimers.get(e.target))
          liveTimers.set(e.target, setTimeout(() => {
            e.target.classList.remove('is-live')
            liveTimers.delete(e.target)
          }, 280))
        }
      })
    },
    // 阈值压低到 12%：一屏滑进来就放出这屏的出场，等吸附停稳时内容已经到位，
    // 不会出现「翻过去先空一下」的空窗
    { threshold: [0.12, 0.5] }
  )
  screens.value.forEach(({ el }) => io.observe(el))
}

function goScreen(i) {
  let top = null
  if (i >= screens.value.length) {
    if (!tailEl.value) return
    top = tailEl.value.getBoundingClientRect().top + window.scrollY
  } else {
    const s = screens.value[i]
    if (!s) return
    top = s.el.getBoundingClientRect().top + window.scrollY
  }
  if (reduced()) window.scrollTo(0, top)
  else window.scrollTo({ top, behavior: 'smooth' })
  active.value = Math.min(i, screens.value.length - 1)
  atTail.value = i >= screens.value.length
}

/* 滚轮一格 = 翻一屏。
   原生 scroll-snap 在鼠标滚轮下会「滚一点再吸回来」：一格只走 100px，离上一屏更近
   于是退回原处。所以这里自己接管滚轮：累计到阈值就整屏滚一次，滚动期间锁 700ms
   吃掉惯性余量。触控板的小步长也一样，因为看的只是方向与累计量。
   触屏、滚动条拖动、键盘不拦，交给原生（snap 会把它吸到整屏）。 */
let acc = 0
let locked = false
let lockTimer = 0
const WHEEL_MIN = 26

function onWheel(e) {
  if (!ROOT.classList.contains('is-deck')) return
  if (e.ctrlKey || e.metaKey) return // 缩放/系统手势
  // 横向滚动（触控板侧滑）不接管
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  const idx = active.value
  const el = screens.value[idx]?.el
  // 这一屏内容比视口还高（窄屏展开长答案）：先在屏内滚，到底/到顶再翻页
  if (el) {
    const over = el.scrollHeight - el.clientHeight
    if (over > 4) {
      const top = el.getBoundingClientRect().top
      const atTop = top >= -2
      const atBottom = top <= -(over - 2)
      if (!(e.deltaY > 0 ? atBottom : atTop)) return // 交给浏览器滚屏内
    }
  }
  e.preventDefault()
  if (locked) return
  acc += e.deltaY
  if (Math.abs(acc) < WHEEL_MIN) return
  const dir = acc > 0 ? 1 : -1
  acc = 0
  const next = Math.min(Math.max(idx + dir, 0), screens.value.length)
  if (next === idx) return
  locked = true
  clearTimeout(lockTimer)
  lockTimer = setTimeout(() => { locked = false; acc = 0 }, 700)
  goScreen(next)
}

function onKey(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
  if (e.target?.isContentEditable) return
  const inDeck = ROOT.classList.contains('is-deck')
  if (!inDeck) return
  const k = e.key
  let next = null
  if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) next = active.value + 1
  else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) next = active.value - 1
  else if (k === 'Home') next = 0
  else if (k === 'End') next = screens.value.length - 1
  if (next === null) return
  // 焦点在 details/summary 上时让浏览器自己处理空格
  if (k === ' ' && e.target?.closest('summary, button, a')) return
  e.preventDefault()
  goScreen(Math.min(Math.max(next, 0), screens.value.length - 1))
}

function onResize() {
  sync()
}

onMounted(() => {
  collect()
  mq = window.matchMedia(QUERY)
  mqHandler = () => { sync() }
  mq.addEventListener?.('change', mqHandler)
  // 系统里中途打开「减少动态效果」也要立刻退回长页
  rmq = window.matchMedia('(prefers-reduced-motion: reduce)')
  rmqHandler = () => sync()
  rmq.addEventListener?.('change', rmqHandler)
  sync()
  observe()
  observeArt()
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('wheel', onWheel, { passive: false })
})

onUnmounted(() => {
  ROOT.classList.remove('is-deck')
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('wheel', onWheel)
  if (mq && mqHandler) mq.removeEventListener?.('change', mqHandler)
  if (rmq && rmqHandler) rmq.removeEventListener?.('change', rmqHandler)
  clearTimeout(lockTimer)
  if (io) io.disconnect()
  if (artIo) artIo.disconnect()
  liveTimers.forEach((t) => clearTimeout(t))
  liveTimers.clear()
})
</script>
