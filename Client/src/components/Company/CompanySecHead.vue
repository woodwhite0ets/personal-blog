<template>
  <h2 class="co-h2">
    <span class="co-h2-t">{{ title }}</span>
    <span class="co-h2-rule" aria-hidden="true"></span>
  </h2>
</template>

<script setup>
// 公司站章节头：标题 + 拉到右端的细线（2026-11 改版：去掉右侧英文注记，减少模板化的眉标）
defineProps({
  title: { type: String, required: true },
})
</script>
