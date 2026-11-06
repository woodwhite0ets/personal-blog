<template>
  <component :is="tag" :to="link" class="user-avatar" :class="[sizeClass, { clickable: !!link }]">
    <img
      v-if="effectiveSrc" :src="effectiveSrc" :alt="alt" :width="px" :height="px"
      class="avatar-img" loading="lazy" decoding="async" @error="onImgError"
    />
    <span v-else class="avatar-char">{{ char }}</span>
  </component>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: String, default: 'sm', validator: v => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v) },
  link: { type: [String, Object], default: '' },
})

const tag = computed(() => (props.link ? 'router-link' : 'span'))
const char = computed(() => {
  const name = props.alt || '?'
  return name.charAt(0).toUpperCase()
})

const PX = { xs: 24, sm: 36, md: 52, lg: 72, xl: 96 }
const px = computed(() => PX[props.size] || 36)

const sizeMap = {
  xs: 'ava-xs', sm: 'ava-sm', md: 'ava-md', lg: 'ava-lg', xl: 'ava-xl',
}
const sizeClass = computed(() => sizeMap[props.size])

// 加载失败就退回首字母，别把破图留在页面上；src 换了要重新给一次机会
const imgFailed = ref(false)
watch(() => props.src, () => { imgFailed.value = false })
const effectiveSrc = computed(() => (imgFailed.value ? '' : props.src))
function onImgError() {
  imgFailed.value = true
}
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent-a20) 0%, var(--accent-a5) 100%);
  border: 2px solid var(--accent-a25);
  overflow: hidden;
  text-decoration: none;
}

.clickable { cursor: pointer; }

/* 尺寸 */
.ava-xs  { width: 24px; height: 24px; border-radius: 4px; }
.ava-sm  { width: 36px; height: 36px; border-radius: 6px; }
.ava-md  { width: 52px; height: 52px; border-radius: 8px; }
.ava-lg  { width: 72px; height: 72px; border-radius: 10px; }
.ava-xl  { width: 96px; height: 96px; border-radius: 12px; }

/* 图片 */
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 首字符 fallback */
.avatar-char {
  font-weight: 800;
  color: var(--accent);
  text-transform: uppercase;
  user-select: none;
}

.ava-xs .avatar-char { font-size: 0.625rem; }
.ava-sm .avatar-char { font-size: 0.875rem; }
.ava-md .avatar-char { font-size: 1.25rem; }
.ava-lg .avatar-char { font-size: 1.75rem; }
.ava-xl .avatar-char { font-size: 2.375rem; }
</style>
