<template>
  <header class="co-mast">
    <h1 class="co-page-title">{{ title }}</h1>
    <p v-if="lead" class="co-lead">{{ lead }}</p>
    <dl v-if="meta.length" class="co-mast-meta">
      <div v-for="m in meta" :key="m.k" class="co-mast-item">
        <dt>{{ m.k }}</dt>
        <dd>{{ m.v }}</dd>
      </div>
    </dl>
  </header>
</template>

<script setup>
// 子页报头：标题 + 引导句 + 一串「已经写在正文里的事实」。
// 不做装饰性 eyebrow（标题上方的小标签），只把正文里的关键数字提上来，便于扫读。
defineProps({
  title: { type: String, required: true },
  lead: { type: String, default: '' },
  meta: { type: Array, default: () => [] },
})
</script>
