<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/HomePage" class="brand">
        <span class="brand-bracket">[</span>
        <span class="brand-text">woodwhite@blog</span>
        <span class="brand-bracket">]</span>
        <span class="brand-path">~/{{ section }}</span>
      </router-link>
      <nav class="nav-links" :class="{ open: navOpen }" @click="navOpen = false">
        <router-link v-for="l in navLinks" :key="l.to" :to="l.to">
          <span class="nav-num">{{ l.num }}</span> {{ l.label }}
        </router-link>
      </nav>
      <div class="nav-actions">
        <ThemeSwitcher />
        <slot name="search" />
        <router-link v-if="!isLoggedIn" to="/login" class="btn-login">登录</router-link>
        <template v-else>
          <router-link to="/editor" class="btn-write">
            <span class="btn-write-icon">+</span> 新文章
          </router-link>
          <div class="user-menu-wrap" ref="userMenuRef">
            <button class="btn-user" @click="showUserMenu = !showUserMenu">
              <UserAvatar :src="currentUser?.avatar" :alt="currentUser?.nickname || currentUser?.username || '?'" size="sm" />
              <span class="user-name">@{{ currentUser?.username }}</span>
              <span class="user-caret" :class="{ open: showUserMenu }">▾</span>
            </button>
            <div v-if="showUserMenu" class="user-dropdown">
              <router-link v-if="isAdmin" to="/admin/dashboard" class="dropdown-item admin-link" @click="showUserMenu = false">
                <span class="dropdown-icon">⚙</span> 管理面板
              </router-link>
              <router-link :to="`/user/${currentUser?.username}`" class="dropdown-item" @click="showUserMenu = false">
                <span class="dropdown-icon">🏠</span> 我的页面
              </router-link>
              <button class="dropdown-item logout" @click="handleLogout">
                <span class="dropdown-icon">⏻</span> 退出登录
              </button>
            </div>
          </div>
        </template>
      </div>
      <button class="nav-toggle" :class="{ open: navOpen }" @click="navOpen = !navOpen" aria-label="菜单" :aria-expanded="navOpen"><span></span><span></span><span></span></button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import ThemeSwitcher from './ThemeSwitcher.vue'
import UserAvatar from './UserAvatar.vue'
import { useAuth } from '../../stores/auth.js'

const route = useRoute()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

const navLinks = [
  { to: '/HomePage', num: '01', label: '首页' },
  { to: '/forum', num: '02', label: '论坛' },
  { to: '/archive', num: '03', label: '归档' },
  { to: '/about', num: '04', label: '关于' },
  { to: '/kb', num: '05', label: '知识库' },
  { to: '/gateway', num: '06', label: 'Gateway' },
]

const section = computed(() => {
  const p = route.path
  if (p.startsWith('/forum')) return 'forum'
  if (p.startsWith('/archive')) return 'archive'
  if (p.startsWith('/about')) return 'about'
  if (p.startsWith('/kb')) return 'kb'
  if (p.startsWith('/gateway')) return 'gateway'
  if (p.startsWith('/post/')) return 'post'
  if (p.startsWith('/user/')) return 'user'
  if (p.startsWith('/editor')) return 'editor'
  return 'main'
})

const navOpen = ref(false)
const showUserMenu = ref(false)
const userMenuRef = ref(null)

function handleLogout() {
  showUserMenu.value = false
  logout()
}

function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) showUserMenu.value = false
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
watch(() => route.fullPath, () => { navOpen.value = false; showUserMenu.value = false })
</script>

<style scoped>
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--navbar-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.navbar-inner {
  max-width: 1060px; margin: 0 auto; padding: 0 24px;
  height: 56px; display: flex; align-items: center; gap: 36px;
}
.brand { display: flex; align-items: baseline; gap: 4px; text-decoration: none; font-size: 14px; font-weight: 600; }
.brand-bracket { color: var(--text-muted); }
.brand-text { color: var(--accent); }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }
.nav-links { display: flex; gap: 28px; flex: 1; }
.nav-links a { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 12px; font-weight: 500; color: var(--text-dim); transition: color 0.2s; letter-spacing: 0.5px; }
.nav-num { color: var(--text-faint); font-size: 10px; font-weight: 700; }
.nav-links a:hover, .nav-links a.router-link-active { color: var(--text); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }
.nav-actions { display: flex; align-items: center; gap: 12px; }
.btn-login { padding: 6px 14px; font: inherit; font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: none; border: 1px solid var(--accent); border-radius: 6px; transition: all 0.2s; }
.btn-login:hover { background: var(--accent); color: var(--on-accent); }
.btn-write { display: flex; align-items: center; gap: 6px; padding: 6px 16px; font: inherit; font-size: 12px; font-weight: 600; color: var(--on-accent); background: var(--accent); border-radius: 6px; text-decoration: none; transition: all 0.2s; }
.btn-write:hover { background: var(--accent-hover); box-shadow: 0 0 20px var(--accent-a25); transform: translateY(-1px); }
.btn-write-icon { font-size: 15px; font-weight: 700; }
.user-menu-wrap { position: relative; }
.btn-user { display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px; font: inherit; font-size: 12px; color: var(--text); background: var(--overlay-a4); border: 1px solid var(--border-strong); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.btn-user:hover { border-color: var(--accent); background: var(--accent-a6); }
.user-name { font-weight: 500; color: var(--text-secondary); }
.user-caret { font-size: 10px; color: var(--text-muted); transition: transform 0.2s; }
.user-caret.open { transform: rotate(180deg); }
.user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; min-width: 180px; background: var(--bg-float); border: 1px solid var(--border-strong); border-radius: 8px; overflow: hidden; box-shadow: 0 12px 40px var(--shadow); z-index: 200; }
.dropdown-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; font: inherit; font-size: 12px; font-weight: 500; color: var(--text-secondary); background: none; border: none; text-decoration: none; cursor: pointer; transition: all 0.15s; }
.dropdown-item.admin-link { color: var(--accent); border-bottom: 1px solid var(--border); }
.dropdown-item.admin-link:hover { background: var(--accent-a6); }
.dropdown-item.logout:hover { color: var(--err); }
.dropdown-icon { font-size: 13px; }
.nav-toggle { display: none; position: relative; z-index: 120; flex-direction: column; justify-content: center; align-items: center; gap: 4px; width: 34px; height: 34px; background: none; border: 1px solid var(--border-strong); border-radius: 6px; cursor: pointer; padding: 0; }
.nav-toggle span { display: block; width: 16px; height: 2px; background: var(--text-dim); border-radius: 1px; transition: transform 0.2s, opacity 0.2s; }
.nav-toggle.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.nav-toggle.open span:nth-child(2) { opacity: 0; }
.nav-toggle.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
@media (max-width: 800px) {
  .navbar-inner { padding: 0 16px; gap: 16px; }
  .brand-path { display: none; }
  .nav-links { display: none; }
  .nav-toggle { display: flex; }
  .nav-actions { gap: 8px; }
  .user-name, .user-caret { display: none; }
  .nav-links.open { display: flex; position: fixed; top: 0; right: 0; bottom: 0; width: min(78vw, 300px); flex-direction: column; align-items: stretch; gap: 0; background: var(--bg); border-left: 1px solid var(--border); padding: 72px 20px 24px; z-index: 95; box-shadow: -8px 0 24px var(--shadow-soft); }
  .nav-links.open::before { content: ''; position: fixed; inset: 0; background: var(--modal-overlay); z-index: -1; }
  .nav-links.open a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 14px; }
}
</style>
