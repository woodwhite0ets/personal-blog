<template>
  <article class="post-card">
    <div class="post-index">{{ String(index + 1).padStart(2, '0') }}</div>
    <div class="post-body">
      <div class="post-meta-row">
        <span class="post-file-chip">.md</span>
        <span class="post-tags">
          <router-link
            v-for="tag in (post.tags && post.tags.length ? post.tags : [{ name: post.tag || '未分类' }])"
            :key="typeof tag === 'string' ? tag : tag.name"
            :to="`/HomePage?tag=${encodeURIComponent(typeof tag === 'string' ? tag : tag.name)}`"
            class="post-tag"
          >#{{ typeof tag === 'string' ? tag : tag.name }}</router-link>
        </span>
        <span class="post-date">{{ post.date }}</span>
        <span class="post-author" v-if="post.author">
          <router-link :to="`/user/${post.author.username}`">@{{ post.author.username }}</router-link>
        </span>
      </div>
      <h2 class="post-title">
        <router-link :to="`/post/${post.slug || post.id}`">{{ post.title }}</router-link>
      </h2>
      <p class="post-excerpt">{{ post.excerpt }}</p>
      <div class="post-footer">
        <span class="post-read-time">
          <span class="footer-label">阅读:</span> {{ post.read_time }}
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
        <router-link :to="`/post/${post.slug || post.id}`" class="post-link">阅读 →</router-link>
      </div>
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
.post-card {
  position: relative;
  display: flex;
  gap: 20px;
  padding: 24px 0 24px 16px;
  border-bottom: 1px solid var(--divider);
  transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
}
.post-card::before {
  content: '';
  position: absolute;
  left: 0; top: 30px; bottom: 30px;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--accent), var(--purple));
  transform: scaleY(0);
  transform-origin: top;
  opacity: 0;
  transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease;
}
.post-card::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent-a50), transparent);
  opacity: 0;
  transition: opacity 0.35s ease;
}
.post-card:hover {
  transform: translateY(-3px);
  background: var(--overlay-a2);
  border-radius: 10px;
  box-shadow: 0 10px 30px var(--shadow);
}
.post-card:hover::before { transform: scaleY(1); opacity: 1; }
.post-card:hover::after { opacity: 1; }

.post-index {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-faint);
  min-width: 28px;
  padding-top: 2px;
}
.post-body { flex: 1; min-width: 0; }
.post-meta-row { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; }
.post-file-chip {
  font-size: 9px; font-weight: 700; letter-spacing: 0.5px;
  color: var(--text-muted);
  padding: 1px 5px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--overlay-a3);
  flex-shrink: 0;
}
.post-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.post-tag {
  font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
  text-transform: uppercase; color: var(--accent);
  text-decoration: none; padding: 1px 4px; border-radius: 2px;
  transition: background 0.2s, color 0.2s;
}
.post-tag:hover { background: var(--accent-a10); color: var(--accent-hover); }
.post-date { font-size: 11px; color: var(--text-muted); }
.post-author { font-size: 11px; margin-left: auto; }
.post-author a { color: var(--text-muted); text-decoration: none; transition: color 0.2s; }
.post-author a:hover { color: var(--accent); }

.post-title { font-size: 17px; font-weight: 700; line-height: 1.5; margin: 0 0 8px; }
.post-title a {
  color: var(--text);
  text-decoration: none;
  background-image: linear-gradient(90deg, var(--accent), var(--purple));
  background-repeat: no-repeat;
  background-size: 0% 1.5px;
  background-position: 0 100%;
  transition: background-size 0.35s cubic-bezier(0.22,1,0.36,1), color 0.2s;
}
.post-title a:hover { color: var(--accent); background-size: 100% 1.5px; }
.post-excerpt { font-size: 13px; color: var(--text-dim); line-height: 1.65; margin: 0 0 12px; }
.post-footer { display: flex; align-items: center; justify-content: space-between; }
.footer-label { color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
.post-read-time { font-size: 11px; color: var(--text-muted); }
.post-link {
  font-size: 11px; font-weight: 600; color: var(--accent);
  text-decoration: none; transition: color 0.2s, transform 0.2s;
  white-space: nowrap;
}
.post-link:hover { color: var(--accent-hover); }

.post-stats { display: flex; align-items: center; gap: 8px; }
.post-like-count, .post-comment-count, .post-view-count {
  font-size: 11px; color: var(--text-muted);
  display: inline-flex; align-items: center; gap: 3px;
  white-space: nowrap;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.post-like-count:hover, .post-comment-count:hover, .post-view-count:hover {
  background: var(--overlay-a4);
  transform: translateY(-1px);
}
.post-like-count.liked { color: var(--err); }
.like-icon { font-size: 13px; }
.comment-icon { font-size: 12px; }
.view-icon { font-size: 12px; }

@media (max-width: 800px) {
  .post-card { flex-direction: column; gap: 10px; padding-left: 0; }
  .post-card::before { display: none; }
  .post-index { min-width: auto; }
  .post-meta-row { flex-wrap: wrap; gap: 8px; }
  .post-author { margin-left: 0; }
}
</style>
