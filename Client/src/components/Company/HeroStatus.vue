<template>
  <aside class="status-panel" aria-label="系统状态">
    <header class="status-head">
      <span class="status-dot" aria-hidden="true"></span>
      <span class="status-title">SYSTEM STATUS</span>
      <span class="status-date">截至 {{ systemStatus.measuredAt }}</span>
    </header>

    <ul class="status-metrics">
      <li v-for="(m, i) in systemStatus.metrics" :key="m.key" class="status-row" :style="{ '--i': i }">
        <span class="status-k">{{ m.key }}</span>
        <span class="status-v">
          <b>{{ shown[i] }}</b><i>{{ m.unit }}</i>
        </span>
        <span class="status-note">{{ m.note }}</span>
        <span v-if="m.bar" class="status-bar" aria-hidden="true">
          <span class="status-bar-fill" :style="{ '--v': m.bar }"></span>
        </span>
      </li>
    </ul>

    <footer class="status-foot">
      <span v-for="l in systemStatus.lights" :key="l.label" class="status-light">
        <i class="status-light-dot" :class="`is-${l.state}`" aria-hidden="true"></i>{{ l.label }}
      </span>
    </footer>
  </aside>
</template>

<script setup>
// 读数先归零、再滚到目标值（仪器自检的手感）。
// 系统开了「减少动态效果」就直接落定，不做数字跳动。
import { ref, onMounted, onUnmounted } from 'vue'
import { systemStatus } from '../../data/systemStatus.js'

const targets = systemStatus.metrics.map((m) => Number(m.value) || 0)
const shown = ref(systemStatus.metrics.map(() => 0))
let raf = 0
let timer = 0

const settle = () => { shown.value = [...targets] }

function runCountUp(duration = 700, delay = 380) {
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (calm) { settle(); return }
  timer = window.setTimeout(() => {
    const t0 = performance.now()
    const tick = (now) => {
      const p = Math.min(1, Math.max(0, (now - t0) / duration))
      const eased = 1 - Math.pow(1 - p, 3)
      shown.value = targets.map((v) => Math.round(v * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else settle()
    }
    raf = requestAnimationFrame(tick)
    // rAF 被节流（后台标签页）时兜底落定
    timer = window.setTimeout(settle, duration + delay + 400)
  }, delay)
}

onMounted(() => runCountUp())
onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
  if (timer) clearTimeout(timer)
})
</script>
