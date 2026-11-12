<template>
  <aside class="status-panel" aria-label="系统状态">
    <header class="status-head">
      <span class="status-dot" aria-hidden="true"></span>
      <span class="status-title">SYSTEM STATUS</span>
      <span class="status-date">截至 {{ systemStatus.measuredAt }}</span>
    </header>

    <ul class="status-metrics">
      <li v-for="m in systemStatus.metrics" :key="m.key" class="status-row">
        <span class="status-k">{{ m.key }}</span>
        <span class="status-v">
          <b>{{ m.value }}</b><i>{{ m.unit }}</i>
        </span>
        <span class="status-note">{{ m.note }}</span>
        <span v-if="m.bar" class="status-bar" aria-hidden="true">
          <span class="status-bar-fill" :style="{ transform: `scaleX(${m.bar})` }"></span>
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
import { systemStatus } from '../../data/systemStatus.js'
</script>
