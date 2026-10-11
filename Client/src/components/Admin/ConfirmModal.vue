<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-card">
        <div class="modal-head">
          <span class="modal-title">{{ title }}</span>
        </div>

        <div class="modal-body">
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="$emit('cancel')" :disabled="loading">取消</button>
            <button
              class="btn"
              :class="danger ? 'btn-danger' : 'btn-primary'"
              @click="$emit('confirm')"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner" role="status" aria-label="提交中"></span>
              {{ loading ? '...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '确认' },
  message: { type: String, default: '确定吗？' },
  confirmText: { type: String, default: '删除' },
  danger: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
})
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 260;
  display: flex; align-items: center; justify-content: center;
  background: var(--modal-overlay);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: 400px; max-width: 92vw;
  background: var(--bg); border: 1px solid var(--border);
  border-radius: 0; box-shadow: none;
}

.modal-head {
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}

.modal-title {
  font-family: var(--font-hand); font-size: 20px; font-weight: 400;
  color: var(--text-bright); letter-spacing: 0;
}

.modal-body { padding: 24px 20px; }

.modal-message {
  font-family: var(--font-sans);
  font-size: 13px; color: var(--text-secondary); line-height: 1.7;
  margin: 0 0 24px; text-align: left;
}

.modal-actions {
  display: flex; gap: 12px; justify-content: center;
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid var(--overlay-a20);
  border-top-color: var(--white);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
