<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-card">
        <div class="terminal-bar">
          <span class="terminal-dot dot-red"></span>
          <span class="terminal-dot dot-yellow"></span>
          <span class="terminal-dot dot-green"></span>
          <span class="terminal-title">{{ title }}</span>
        </div>

        <div class="modal-body">
          <p class="modal-message">{{ message }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" @click="$emit('cancel')" :disabled="loading">cancel</button>
            <button
              class="btn-confirm"
              :class="{ danger }"
              @click="$emit('confirm')"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner"></span>
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
  title: { type: String, default: 'confirm' },
  message: { type: String, default: 'Are you sure?' },
  confirmText: { type: String, default: 'Delete' },
  danger: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
})
defineEmits(['confirm', 'cancel'])
</script>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: var(--modal-overlay);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: 400px; max-width: 92vw;
  background: var(--bg-float); border: 1px solid var(--border-strong);
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 0 60px var(--shadow);
}

.terminal-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: var(--border); border-bottom: 1px solid var(--border-strong);
}

.terminal-dot { width: 11px; height: 11px; border-radius: 50%; }
.dot-red    { background: var(--err); }
.dot-yellow { background: var(--warn); }
.dot-green  { background: var(--ok); }

.terminal-title {
  flex: 1; text-align: center;
  font-size: 11px; color: var(--text-hint); letter-spacing: 1px;
}

.modal-body { padding: 24px 20px; }

.modal-message {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px; color: var(--text-secondary); line-height: 1.7;
  margin: 0 0 24px; text-align: center;
}

.modal-actions {
  display: flex; gap: 12px; justify-content: center;
}

.btn-cancel, .btn-confirm {
  padding: 8px 24px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px; font-weight: 600; border-radius: 6px;
  cursor: pointer; transition: all 0.2s; border: 1px solid var(--border-strong);
}

.btn-cancel {
  color: var(--text-dim); background: none;
}
.btn-cancel:hover { border-color: var(--text-dim); color: var(--text); }

.btn-confirm {
  color: var(--on-accent); background: var(--accent); border-color: var(--accent);
  display: flex; align-items: center; gap: 6px;
}
.btn-confirm:hover { background: var(--accent-hover); }

.btn-confirm.danger {
  color: var(--white); background: var(--err-a15); border-color: var(--err-a30);
}
.btn-confirm.danger:hover { background: var(--err-a25); border-color: var(--err); }

.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid var(--overlay-a20);
  border-top-color: var(--white);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
