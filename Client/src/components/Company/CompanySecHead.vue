<template>
  <h2 class="co-h2">
    <span class="co-h2-t">{{ title }}</span>
    <span class="co-h2-rule" aria-hidden="true"></span>
    <span v-if="note" class="co-h2-note">{{ note }}</span>
  </h2>
</template>

<script setup>
// 公司站章节头：大衬线标题 + 拉到右端的细线 + 小注记（首页与子页同一套标记）
defineProps({
  title: { type: String, required: true },
  note: { type: String, default: '' },
})
</script>
