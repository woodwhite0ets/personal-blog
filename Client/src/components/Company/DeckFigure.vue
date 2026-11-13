<template>
  <!-- 每屏背后的一张图案：白底黑线的版画／工程图，用 multiply 把纸底吃掉、只留线。
       图片全部是 Public domain 或本项目自有，来源见 public/bg/art/CREDITS.md -->
  <div class="dk-art" :class="`dk-art--${art}`" role="presentation"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
})

// 屏名 → 图案名（CSS 里按图案名定义背景图，一个图案可以被多页复用）
const ART = {
  plate: 'machine',
  scope: 'orbit',
  proof: 'terrain',
  process: 'exploded',
  pricing: 'ledger',
  faq: 'patent',
  tail: 'constellation',
}
const art = computed(() => ART[props.name] || 'machine')
</script>
