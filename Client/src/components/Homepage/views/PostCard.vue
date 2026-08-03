<template>
  <article class="post-card" :style="{ animationDelay: `${index * 60}ms` }">
    <div class="post-index">{{ String(index + 1).padStart(2, '0') }}</div>
    <div class="post-body">
      <div class="post-meta-row">
        <span class="post-tags">
          <router-link
            v-for="tag in (post.tags && post.tags.length ? post.tags : [{ name: post.tag || 'uncategorized' }])"
            :key="typeof tag === 'string' ? tag : tag.name"
            :to="`/HomePage?tag=${encodeURIComponent(typeof tag === 'string' ? tag : tag.name)}`"
            class="post-tag"
          >#{{ typeof tag === 'string' ? tag : tag.name }}</router-link>
        </span>
        <span class="post-date">{{ post.date }}</span>
        <span class="post-author" v-if="post.author">
          <router-link :to="`/user/${post.author.username}`">
            @{{ post.author.username }}
          </router-link>
        </span>
      </div>
      <h2 class="post-title">
        <router-link :to="`/post/${post.slug || post.id}`">{{ post.title }}</router-link>
      </h2>
      <p class="post-excerpt">{{ post.excerpt }}</p>
      <div class="post-footer">
        <span class="post-read-time">
          <span class="footer-label">read:</span> {{ post.read_time }}
        </span>
        <div class="post-stats">
          <span class="post-view-count">
            <span class="view-icon">👁</span> {{ post.views || 0 }}
          </span>
          <span class="post-like-count" :class="{ liked: post.user_liked }">
            <span class="like-icon">{{ post.user_liked ? '♥' : '♡' }}</span> {{ post.like_count || 0 }}
          </span>
          <span class="post-comment-count">
            <span class="comment-icon">💬</span> {{ post.comment_count || 0 }}
          </span>
        </div>
        <router-link :to="`/post/${post.slug || post.id}`" class="post-link">read →</router-link>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  post: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    default: 0,
  },
})
</script>

<style scoped>
.post-card {
  display: flex;
  gap: 20px;
  padding: 24px 0;
  border-bottom: 1px solid var(--divider);
  animation: fadeUp 0.5s ease both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-index {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-faint);
  min-width: 28px;
  padding-top: 2px;
}

.post-body {
  flex: 1;
  min-width: 0;
}

.post-meta-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.post-tags {
  display: flex; flex-wrap: wrap; gap: 4px;
}

.post-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--accent);
  text-decoration: none;
  padding: 1px 4px;
  border-radius: 2px;
  transition: background 0.2s;
}

.post-tag:hover {
  background: var(--accent-a10);
}

.post-date {
  font-size: 11px;
  color: var(--text-muted);
}

.post-author {
  font-size: 11px;
  margin-left: auto;
}

.post-author a {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
}

.post-author a:hover {
  color: var(--accent);
}

.post-title {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
  margin: 0 0 8px;
}

.post-title a {
  color: var(--text);
  text-decoration: none;
  transition: color 0.2s;
}

.post-title a:hover {
  color: var(--accent);
}

.post-excerpt {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.65;
  margin: 0 0 12px;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-label {
  color: var(--text-muted);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.post-read-time {
  font-size: 11px;
  color: var(--text-muted);
}

.post-link {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  transition: color 0.2s;
}

.post-link:hover { color: var(--accent-hover); }

.post-stats {
  display: flex; align-items: center; gap: 12px;
}

.post-like-count, .post-comment-count {
  font-size: 11px; color: var(--text-muted);
  display: flex; align-items: center; gap: 3px;
}

.post-like-count.liked {
  color: var(--err);
}

.like-icon { font-size: 13px; }
.comment-icon { font-size: 12px; }

/* ====== 响应式 ====== */
@media (max-width: 800px) {
  .post-card {
    flex-direction: column;
    gap: 10px;
  }
  .post-index {
    min-width: auto;
  }
}
</style>