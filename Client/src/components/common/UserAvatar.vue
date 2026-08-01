<template>
  <component :is="tag" :to="link" class="user-avatar" :class="[sizeClass, { clickable: !!link }]">
    <img v-if="src" :src="src" :alt="alt" class="avatar-img" @error="onImgError" />
    <span v-else class="avatar-char">{{ char }}</span>
  </component>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  size: { type: String, default: 'sm', validator: v => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v) },
  link: { type: [String, Object], default: '' },
})

const imgFailed = ref(false)

const tag = computed(() => (props.link ? 'router-link' : 'span'))
const char = computed(() => {
  const name = props.alt || '?'
  return name.charAt(0).toUpperCase()
})

const sizeMap = {
  xs: 'ava-xs', sm: 'ava-sm', md: 'ava-md', lg: 'ava-lg', xl: 'ava-xl',
}
const sizeClass = computed(() => sizeMap[props.size])

const effectiveSrc = computed(() => {
  if (imgFailed.value) return ''
  return props.src || ''
})

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

.ava-xs .avatar-char { font-size: 10px; }
.ava-sm .avatar-char { font-size: 14px; }
.ava-md .avatar-char { font-size: 20px; }
.ava-lg .avatar-char { font-size: 28px; }
.ava-xl .avatar-char { font-size: 38px; }
</style>
