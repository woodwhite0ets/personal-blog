<template>
  <article class="post-card">
    <h2 class="post-title">
      <router-link :to="`/post/${post.slug || post.id}`">{{ post.title }}</router-link>
    </h2>
    <p class="post-excerpt">{{ post.excerpt }}</p>
    <div class="post-dateline">
      <time class="post-date">{{ post.date }}</time>
      <span v-if="post.author" class="post-author">
        <router-link :to="`/user/${post.author.username}`">@{{ post.author.username }}</router-link>
      </span>
      <span class="post-read" v-if="post.read_time">{{ post.read_time }}</span>
      <span class="post-tags">
        <router-link
          v-for="tag in (post.tags && post.tags.length ? post.tags : [{ name: post.tag || '未分类' }])"
          :key="typeof tag === 'string' ? tag : tag.name"
          :to="`/HomePage?tag=${encodeURIComponent(typeof tag === 'string' ? tag : tag.name)}`"
          class="post-tag"
        >#{{ typeof tag === 'string' ? tag : tag.name }}</router-link>
      </span>
    </div>
  </article>
</template>

<script setup>
defineProps({
  post: { type: Object, required: true },
  index: { type: Number, default: 0 },
})
</script>

<style scoped>
/* 信笺式文章条目：发丝线分隔，无卡片盒/编号/芯片/emoji */
.post-card {
  padding: 34px 0 30px;
  border-bottom: 1px solid var(--border);
}
.post-title {
  font-family: var(--font-sans);
  font-size: 23px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 10px;
  letter-spacing: -0.01em;
}
.post-title a {
  color: var(--text-bright);
  text-decoration: none;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-size: 0% 1px;
  background-position: 0 100%;
  transition: background-size .35s var(--ease-spring), color .25s var(--ease-spring);
}
.post-title a:hover { color: var(--accent); background-size: 100% 1px; }
.post-excerpt {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin: 0 0 14px;
  max-width: 640px;
}
.post-dateline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 13px;
  color: var(--text-dim);
}
.post-date { font-variant-numeric: tabular-nums; letter-spacing: .01em; }
.post-author a { color: var(--text-dim); text-decoration: none; transition: color .2s; }
.post-author a:hover { color: var(--accent); }
.post-tags { display: flex; flex-wrap: wrap; gap: 10px; margin-left: auto; }
.post-tag {
  font-size: 13px;
  color: var(--text-dim);
  text-decoration: none;
  transition: color .2s;
}
.post-tag:hover { color: var(--accent); }

@media (max-width: 800px) {
  .post-card { padding: 26px 0 22px; }
  .post-title { font-size: 20px; }
  .post-tags { margin-left: 0; width: 100%; }
}
</style>
