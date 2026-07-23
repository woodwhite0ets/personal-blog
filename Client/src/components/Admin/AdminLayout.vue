<template>
  <div class="admin-layout">
    <div class="bg-grid"></div>
    <div class="bg-scanline"></div>

    <!-- 导航栏 -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/HomePage" class="brand">
          <span class="brand-bracket">[</span>
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-bracket">]</span>
          <span class="brand-path">~/admin</span>
        </router-link>
        <div class="nav-actions">
          <span class="admin-badge">sudo mode</span>
          <router-link to="/HomePage" class="nav-link">← blog</router-link>
          <button class="btn-user" @click="showMenu = !showMenu">
            <span class="user-avatar">{{ avatarChar }}</span>
            <span class="user-name">@{{ currentUser?.username }}</span>
          </button>
          <div v-if="showMenu" class="user-dropdown">
            <router-link :to="`/user/${currentUser?.username}`" class="dropdown-item" @click="showMenu = false">
              my page
            </router-link>
            <button class="dropdown-item logout" @click="handleLogout">logout</button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <div class="main-layout">
      <aside class="sidebar">
        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-cyan"></span>
            <span class="panel-dot dot-cyan dim"></span>
            <span class="panel-title">cat /etc/admin/menu</span>
          </div>
          <div class="panel-body nav-body">
            <router-link to="/admin/dashboard" class="nav-item" active-class="active">
              <span class="nav-num">01</span> dashboard
            </router-link>
            <router-link to="/admin/posts" class="nav-item" active-class="active">
              <span class="nav-num">02</span> posts
            </router-link>
            <router-link to="/admin/users" class="nav-item" active-class="active">
              <span class="nav-num">03</span> users
            </router-link>
            <router-link to="/admin/logs" class="nav-item" active-class="active">
              <span class="nav-num">04</span> logs
            </router-link>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-dot dot-green"></span>
            <span class="panel-dot dot-green dim"></span>
            <span class="panel-title">system.info</span>
          </div>
          <div class="panel-body">
            <div class="info-line">
              <span class="info-key">os</span>
              <span class="info-val">blogOS v2.0.1</span>
            </div>
            <div class="info-line">
              <span class="info-key">role</span>
              <span class="info-val terminal-green">admin</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="content">
        <router-view />
      </main>
    </div>

    <footer class="footer">
      <div class="footer-line">
        <span class="footer-prompt">❯</span>
        <span class="footer-cmd">sudo systemctl status blog-admin</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../../stores/auth.js'

const { currentUser, logout } = useAuth()
const showMenu = ref(false)

const avatarChar = computed(() => {
  if (currentUser.value?.nickname) return currentUser.value.nickname.charAt(0).toUpperCase()
  if (currentUser.value?.username) return currentUser.value.username.charAt(0).toUpperCase()
  return '?'
})

function handleLogout() {
  showMenu.value = false
  logout()
}

function handleClickOutside(e) {
  if (!e.target.closest('.btn-user') && !e.target.closest('.user-dropdown')) {
    showMenu.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.admin-layout {
  min-height: 100vh; background: #0a0a0c;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  color: #c9d1d9; position: relative; overflow-x: hidden;
}

.bg-grid {
  position: fixed; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
  background-size: 64px 64px; pointer-events: none; z-index: 0;
}

.bg-scanline {
  position: fixed; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
  pointer-events: none; z-index: 0; animation: scan 8s linear infinite;
}
@keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(4px); } }

.navbar {
  position: sticky; top: 0; z-index: 100;
  background: rgba(10,10,12,0.88); backdrop-filter: blur(16px);
  border-bottom: 1px solid #1c1d21;
}

.navbar-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; justify-content: space-between;
}

.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 14px; font-weight: 600; }
.brand-bracket { color: #484b52; }
.brand-text { color: #00d4ff; }
.brand-path { color: #6e737a; margin-left: 8px; font-size: 12px; }

.nav-actions { display: flex; align-items: center; gap: 12px; position: relative; }

.admin-badge {
  font-size: 10px; font-weight: 700; letter-spacing: 1px;
  color: #feba0a; padding: 4px 10px;
  background: rgba(254,186,10,0.08); border: 1px solid rgba(254,186,10,0.2);
  border-radius: 4px; text-transform: uppercase;
}

.nav-link { font-size: 12px; color: #6e737a; text-decoration: none; transition: color 0.2s; }
.nav-link:hover { color: #00d4ff; }

.btn-user {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 10px 4px 4px;
  font-family: inherit; font-size: 12px;
  color: #c9d1d9; background: rgba(255,255,255,0.04);
  border: 1px solid #25262a; border-radius: 8px;
  cursor: pointer; transition: all 0.2s;
}
.btn-user:hover { border-color: #00d4ff; background: rgba(0,212,255,0.06); }

.user-avatar {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: #00d4ff; color: #0a0a0c;
  font-weight: 700; font-size: 12px; border-radius: 6px; text-transform: uppercase;
}
.user-name { font-weight: 500; color: #8b9098; }

.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 160px; background: #16171b; border: 1px solid #25262a;
  border-radius: 8px; overflow: hidden;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5); z-index: 200;
}

.dropdown-item {
  display: flex; align-items: center; width: 100%; padding: 10px 14px;
  font-family: inherit; font-size: 12px; font-weight: 500;
  color: #8b9098; background: none; border: none;
  text-decoration: none; cursor: pointer; transition: all 0.15s;
}
.dropdown-item:hover { color: #c9d1d9; background: rgba(255,255,255,0.03); }
.dropdown-item.logout:hover { color: #ff5f57; }

.main-layout {
  position: relative; z-index: 1;
  max-width: 1200px; margin: 0 auto; padding: 40px 24px;
  display: grid; grid-template-columns: 220px 1fr; gap: 40px;
}

.sidebar { display: flex; flex-direction: column; gap: 16px; }

.sidebar-panel {
  background: #0f1013; border: 1px solid #1c1d21;
  border-radius: 8px; overflow: hidden;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: rgba(255,255,255,0.015);
  border-bottom: 1px solid #1c1d21;
}
.panel-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-cyan { background: #00d4ff; }
.dot-green { background: #2bd64e; }
.dim { opacity: 0.3; }
.panel-title {
  flex: 1; font-size: 10px; font-weight: 600;
  color: #484b52; text-align: center; letter-spacing: 1.5px; text-transform: lowercase;
}

.panel-body { padding: 8px 0; }

.nav-body { padding: 4px 0; }

.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; font-size: 12px; font-weight: 500;
  color: #6e737a; text-decoration: none;
  border-left: 2px solid transparent; transition: all 0.2s;
}
.nav-item:hover { color: #c9d1d9; background: rgba(255,255,255,0.02); }
.nav-item.active { color: #00d4ff; border-left-color: #00d4ff; background: rgba(0,212,255,0.04); }
.nav-num { color: #33363c; font-size: 10px; font-weight: 700; min-width: 18px; }
.nav-item.active .nav-num { color: #00d4ff; }

.info-line { display: flex; justify-content: space-between; padding: 5px 12px; font-size: 11px; }
.info-key { color: #484b52; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
.info-val { color: #8b9098; }
.terminal-green { color: #2bd64e; }

.content { min-height: 500px; }

.footer {
  position: relative; z-index: 1;
  border-top: 1px solid #1c1d21; padding: 24px; text-align: center;
}
.footer-line { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; }
.footer-prompt { color: #00d4ff; }
.footer-cmd { color: #484b52; }

@media (max-width: 800px) {
  .main-layout { grid-template-columns: 1fr; }
  .sidebar { flex-direction: row; flex-wrap: wrap; gap: 8px; }
  .sidebar-panel { flex: 1; min-width: 140px; }
  .admin-badge { display: none; }
}
</style>
