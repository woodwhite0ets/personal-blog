<template>
  <section class="post-list-section">
    <!-- 分区标题 -->
    <div class="section-head">
      <span class="section-arrow">❯</span>
      <span class="section-title">ls -la ./posts</span>
      <span class="section-count">— {{ posts.length }} 篇文章</span>
      <button v-if="emptyText" class="btn-refresh" @click="$emit('refresh')" title="刷新">
        ↻
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="state-box">
      <span class="spinner"></span>
      <span class="state-text">正在加载文章...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="state-box error">
      <span class="err-prefix">错误!</span>
      <span class="state-text">{{ error }}</span>
      <button class="link-btn" @click="$emit('refresh')">重试</button>
    </div>

    <!-- 空状态 -->
    <div v-else-if="posts.length === 0" class="state-box">
      <span class="state-text">{{ emptyText || '暂无文章' }}</span>
    </div>

    <!-- 文章列表 -->
    <template v-else>
      <PostCard
        v-for="(post, i) in posts"
        :key="post.id"
        :post="post"
        :index="i"
      />

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more-wrap">
        <button
          @click="$emit('load-more')"
          class="btn-load-more"
          :disabled="loadingMore"
        >
          <span class="btn-prompt">❯</span>
          {{ loadingMore ? '加载中...' : '更多文章' }}
        </button>
      </div>
    </template>
  </section>
</template>

<script setup>
import PostCard from './views/PostCard.vue'

defineProps({
  posts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingMore: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
  emptyText: {
    type: String,
    default: '',
  },
})

defineEmits(['load-more', 'refresh'])
</script>

<style scoped>
.post-list-section {
  /* 容器 */
}

/* ====== 分区标题 ====== */
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}

.section-arrow {
  color: var(--accent);
  font-weight: 700;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.5px;
}

.section-count {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}

.btn-refresh {
  font-family: inherit;
  font-size: 14px;
  color: var(--text-muted);
  background: none;
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  cursor: pointer;
  padding: 2px 8px;
  transition: all 0.2s;
}

.btn-refresh:hover {
  color: var(--accent);
  border-color: var(--accent);
}

/* ====== 状态 ====== */
.state-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  font-size: 13px;
  color: var(--text-muted);
}

.state-box.error {
  color: var(--err);
  flex-direction: column;
  gap: 8px;
}

.err-prefix {
  font-weight: 700;
  letter-spacing: 1px;
  font-size: 12px;
}

.state-text {
  color: inherit;
}

.link-btn {
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.link-btn:hover {
  color: var(--accent-hover);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ====== 加载更多 ====== */
.load-more-wrap {
  text-align: center;
  padding: 36px 0 12px;
}

.btn-load-more {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 28px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  background: none;
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-load-more:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-prompt {
  color: var(--accent);
}
</style>