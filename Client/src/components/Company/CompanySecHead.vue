<template>
  <h2 class="co-h2">
    <span v-if="index" class="co-h2-idx" aria-hidden="true">{{ index }}</span>
    <span class="co-h2-t">{{ title }}</span>
    <span v-if="latin" class="co-h2-lat" aria-hidden="true">{{ latin }}</span>
    <span class="co-h2-rule" aria-hidden="true"></span>
    <span v-if="index" class="co-h2-ruler" aria-hidden="true"></span>
    <span v-if="index" class="co-h2-ghost" aria-hidden="true">{{ index }}</span>
  </h2>
</template>

<script setup>
// 公司站章节头：标题 + 拉到右端的细线。
// 结构件（参照鹰角官方站的技术界面语言）：
//   · 斜切色块上的编号（.co-h2-idx）
//   · 标题背后的幽灵大号数字（.co-h2-ghost）
//   · 拉丁注记 + 右侧刻度尺
// 不传 index 时退回原来的两件式，博客等旧调用不受影响。
defineProps({
  title: { type: String, required: true },
  index: { type: String, default: '' },
  latin: { type: String, default: '' },
})
</script>
