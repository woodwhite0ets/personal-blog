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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: 400px; max-width: 92vw;
  background: #16171b; border: 1px solid #25262a;
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 0 60px rgba(0,0,0,0.5);
}

.terminal-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: #1c1d21; border-bottom: 1px solid #25262a;
}

.terminal-dot { width: 11px; height: 11px; border-radius: 50%; }
.dot-red    { background: #ff5f57; }
.dot-yellow { background: #feba0a; }
.dot-green  { background: #2bd64e; }

.terminal-title {
  flex: 1; text-align: center;
  font-size: 11px; color: #5a5d64; letter-spacing: 1px;
}

.modal-body { padding: 24px 20px; }

.modal-message {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 13px; color: #8b9098; line-height: 1.7;
  margin: 0 0 24px; text-align: center;
}

.modal-actions {
  display: flex; gap: 12px; justify-content: center;
}

.btn-cancel, .btn-confirm {
  padding: 8px 24px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px; font-weight: 600; border-radius: 6px;
  cursor: pointer; transition: all 0.2s; border: 1px solid #25262a;
}

.btn-cancel {
  color: #6e737a; background: none;
}
.btn-cancel:hover { border-color: #6e737a; color: #c9d1d9; }

.btn-confirm {
  color: #0a0a0c; background: #00d4ff; border-color: #00d4ff;
  display: flex; align-items: center; gap: 6px;
}
.btn-confirm:hover { background: #00b8d4; }

.btn-confirm.danger {
  color: #fff; background: rgba(255,95,87,0.15); border-color: rgba(255,95,87,0.3);
}
.btn-confirm.danger:hover { background: rgba(255,95,87,0.25); border-color: #ff5f57; }

.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
