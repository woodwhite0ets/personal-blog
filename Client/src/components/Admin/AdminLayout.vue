<template>
  <div class="admin-layout">

    <!-- 导航栏 -->
    <header class="navbar">
      <div class="navbar-inner">
        <router-link to="/blog" class="brand">
          <span class="brand-text">woodwhite@blog</span>
          <span class="brand-suffix">管理</span>
        </router-link>
        <div class="nav-actions">
          <span class="admin-badge">管理员</span>
          <router-link to="/blog" class="nav-link">← 博客</router-link>
          <button class="btn btn-secondary btn-user" @click="showMenu = !showMenu">
            <UserAvatar :src="currentUser?.avatar" :alt="(currentUser?.nickname || currentUser?.username || '?')" size="sm" />
            <span class="user-name">@{{ currentUser?.username }}</span>
          </button>
          <div v-if="showMenu" class="user-dropdown">
            <router-link :to="`/user/${currentUser?.username}`" class="dropdown-item" @click="showMenu = false">
              我的主页
            </router-link>
            <button class="dropdown-item logout" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <div class="main-layout">
      <aside class="sidebar">
        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-title deco-rule">管理</span>
          </div>
          <div class="panel-body nav-body">
            <router-link to="/admin/dashboard" class="nav-item" active-class="active"> 仪表盘
            </router-link>
            <router-link to="/admin/posts" class="nav-item" active-class="active"> 文章
            </router-link>
            <router-link to="/admin/users" class="nav-item" active-class="active"> 用户
            </router-link>
            <router-link to="/admin/tools" class="nav-item" active-class="active"> 工具库
            </router-link>
            <router-link to="/admin/logs" class="nav-item" active-class="active"> 日志
            </router-link>
          </div>
        </div>

        <div class="sidebar-panel">
          <div class="panel-bar">
            <span class="panel-title deco-rule">系统信息</span>
          </div>
          <div class="panel-body">
            <div class="info-line">
              <span class="info-key">系统</span>
              <span class="info-val">v2.0.1</span>
            </div>
            <div class="info-line">
              <span class="info-key">角色</span>
              <span class="info-val">管理员</span>
            </div>
          </div>
        </div>
      </aside>

      <main class="content">
        <router-view />
      </main>
    </div>

    <SiteFooter command="" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuth } from '../../stores/auth.js'
import SiteFooter from '../common/SiteFooter.vue'
import UserAvatar from '../common/UserAvatar.vue'

const { currentUser, logout } = useAuth()
const showMenu = ref(false)

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
  min-height: 100dvh; background-color: var(--bg);
  font-family: var(--font-sans);
  color: var(--text); position: relative; overflow-x: hidden;
}

.navbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--navbar-bg); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.navbar-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; justify-content: space-between;
}

.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
.brand-text { color: var(--accent); }

.nav-actions { display: flex; align-items: center; gap: 12px; position: relative; }

.admin-badge {
  font-size: 0.625rem; font-weight: 700; letter-spacing: 1px;
  color: var(--warn); padding: 4px 10px;
  background: var(--warn-a8); border: 1px solid var(--warn-a20);
  border-radius: 4px; text-transform: uppercase;
}

.nav-link { font-size: 0.75rem; color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
.nav-link:hover { color: var(--accent); }

.btn-user {
  padding: 4px 10px 4px 4px;
  border-radius: 8px;
  gap: 8px;
}
.btn-user:hover { border-color: var(--accent); background: var(--accent-a6); }

.user-name { font-weight: 500; color: var(--text-secondary); }

.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 160px; background-color: var(--bg); border: 1px solid var(--border);
  border-radius: 0; box-shadow: none; z-index: 200;
}

.dropdown-item {
  display: flex; align-items: center; width: 100%; padding: 10px 14px;
  font-family: inherit; font-size: 0.75rem; font-weight: 500;
  color: var(--text-secondary); background: none; border: none;
  text-decoration: none; cursor: pointer; transition: color 0.15s, background-color 0.15s, border-color 0.15s, opacity 0.15s, transform 0.15s, box-shadow 0.15s;
}
.dropdown-item:hover { color: var(--text); background: var(--overlay-a3); }
.dropdown-item.logout:hover { color: var(--err); }

.main-layout {
  position: relative; z-index: 1;
  max-width: 1200px; margin: 0 auto; padding: 40px 24px;
  display: grid; grid-template-columns: 220px 1fr; gap: 40px;
}

.sidebar { display: flex; flex-direction: column; gap: 16px; }

.sidebar-panel {
  background-color: var(--bg-elevated); border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden;
}

.panel-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; background: var(--overlay-a15);
  border-bottom: 1px solid var(--border);
}
.panel-title {
  flex: 1; font-size: 0.625rem; font-weight: 600;
  color: var(--text-muted); text-align: center; letter-spacing: 1.5px; text-transform: lowercase;
}

.panel-body { padding: 8px 0; }

.nav-body { padding: 4px 0; }

.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; font-size: 0.75rem; font-weight: 500;
  color: var(--text-dim); text-decoration: none;
  border-left: 2px solid transparent; transition: color 0.2s, background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.2s, box-shadow 0.2s;
}
.nav-item:hover { color: var(--text); background: var(--overlay-a2); }
.nav-item.active { color: var(--accent); border-left-color: var(--accent); background: var(--accent-a4); }

.info-line { display: flex; justify-content: space-between; padding: 5px 12px; font-size: 0.6875rem; }
.info-key { color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
.info-val { color: var(--text-secondary); }

.content { min-height: 500px; }

@media (max-width: 800px) {
  .main-layout { grid-template-columns: 1fr; }
  .sidebar { flex-direction: row; flex-wrap: wrap; gap: 8px; }
  .sidebar-panel { flex: 1; min-width: 140px; }
  .admin-badge { display: none; }
}

/* 信笺统一（组件内，发丝线分区）*/
.sidebar-panel { background: transparent; border: none; border-radius: 0; box-shadow: none; padding: 0; }
.panel-bar { border-bottom: none; background: transparent; padding: 0 0 12px; }
.panel-body { padding: 0; }
.panel-title { font-family: var(--font-hand); font-size: 1.0625rem; font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--text-bright); }
.info-line { padding: 5px 0; }
.info-key { color: var(--text-dim); }

/* 统一：后台头部与主站一致 */
.navbar { background-color: var(--bg); border-bottom: 1px solid var(--border); }
.navbar-inner { max-width: 1120px; margin: 0 auto; padding: 0 28px; height: 74px; display: flex; align-items: center; gap: 24px; }
.brand-text { font-family: var(--font-hand); font-size: 1.3125rem; color: var(--text-bright); }
.brand-suffix { font-size: 0.8125rem; color: var(--text-dim); margin-left: 8px; }
.admin-badge { font-size: 0.8125rem; color: var(--text-dim); border: 1px solid var(--border); border-radius: 3px; padding: 2px 8px; }
.nav-link { font-size: 0.9375rem; color: var(--text-secondary); text-decoration: none; }
.nav-link:hover { color: var(--text-bright); }
.btn-user { border-radius: 4px; }
</style>
