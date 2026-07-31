<template>
  <div class="theme-switcher" ref="root">
    <button class="theme-btn" @click="open = !open" title="switch theme">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
      </svg>
    </button>
    <div v-if="open" class="theme-dropdown">
      <div class="theme-dropdown-title">theme</div>
      <button
        v-for="t in themes"
        :key="t.id"
        class="theme-option"
        :class="{ active: t.id === current }"
        @click="pick(t.id)"
      >
        <span class="theme-swatch" :style="{ background: swatchColor(t.id) }"></span>
        <span class="theme-name">{{ t.label }}</span>
        <span class="theme-hint">{{ t.hint }}</span>
        <span v-if="t.id === current" class="theme-check">✓</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../../stores/theme.js'

const { current, themes, setTheme } = useTheme()
const open = ref(false)
const root = ref(null)

// 每主题的预览色块（映射到各自 accent）
const swatchColor = (id) => ({
  terminal: 'var(--accent)',
  paper: '#0a7f9e',
  midnight: '#58a6ff',
  solar: '#ffb454',
})[id]

function pick(id) {
  setTheme(id)
  open.value = false
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.theme-switcher { position: relative; }

.theme-btn {
  width: 34px; height: 34px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--border-strong); border-radius: 6px;
  color: var(--text-dim); cursor: pointer; transition: all 0.2s;
}

.theme-btn:hover {
  border-color: var(--accent); color: var(--accent);
}

.theme-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 220px;
  background: var(--bg-float); border: 1px solid var(--border-strong);
  border-radius: 8px; overflow: hidden;
  box-shadow: 0 12px 40px var(--shadow);
  z-index: 300;
}

.theme-dropdown-title {
  padding: 8px 14px;
  font-size: 10px; font-weight: 600; letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}

.theme-option {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px;
  font-family: inherit; font-size: 12px; font-weight: 500;
  color: var(--text-secondary); background: none; border: none;
  cursor: pointer; transition: all 0.15s;
}

.theme-option:hover { background: var(--overlay-a4); color: var(--text); }

.theme-option.active { color: var(--accent); }

.theme-swatch {
  width: 14px; height: 14px; border-radius: 3px;
  flex-shrink: 0; border: 1px solid var(--border-strong);
}

.theme-name { font-weight: 700; }

.theme-hint {
  flex: 1; font-size: 10px; color: var(--text-muted);
  text-align: right;
}

.theme-check { color: var(--accent); font-weight: 700; }
</style>
