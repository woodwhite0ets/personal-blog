<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/HomePage" class="brand">
        <span class="brand-text">woodwhite@blog</span>
      </router-link>
      <nav class="nav-links" :class="{ open: navOpen }" @click="navOpen = false">
        <router-link v-for="l in navLinks" :key="l.to" :to="l.to"> {{ l.label }}
        </router-link>
        <router-link v-if="!isLoggedIn" to="/login" class="nav-drawer-auth">登录</router-link>
        <router-link v-else :to="`/user/${currentUser?.username}`" class="nav-drawer-auth">我的页面</router-link>
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
            <Transition name="pop">
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
            </Transition>
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
import UserAvatar from './UserAvatar.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { useAuth } from '../../stores/auth.js'

const route = useRoute()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

const navLinks = [
  { to: '/HomePage', label: '首页' },
  { to: '/forum', label: '文章' },
  { to: '/ai-daily', label: 'AI 榜' },
  { to: '/tools', label: '工具' },
  { to: '/tags', label: '分类' },
  { to: '/projects', label: '项目' },
  { to: '/archive', label: '归档' },
  { to: '/now', label: '现在' },
  { to: '/about', label: '关于' },
]

const section = computed(() => {
  const p = route.path
  if (p.startsWith('/forum')) return 'forum'
  if (p.startsWith('/archive')) return 'archive'
  if (p.startsWith('/about')) return 'about'
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
  max-width: 1120px; margin: 0 auto; padding: 0 28px;
  height: 74px; display: flex; align-items: center; gap: 38px;
}
.brand { display: flex; align-items: baseline; gap: 4px; flex-shrink: 0; text-decoration: none; font-size: 14px; font-weight: 600; }
.brand-bracket { color: var(--text-muted); }
.brand-text { font-family: var(--font-hand); font-size: 21px; color: var(--text-bright); }
.brand-caret { color: var(--accent); font-size: 12px; margin-left: 1px; }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 12px; }
.nav-links { display: flex; gap: 28px; flex: 1; }
.nav-links a { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 15px; font-weight: 400; color: var(--text-secondary); transition: color .25s var(--ease-spring); position: relative; white-space: nowrap; }
.nav-num { color: var(--text-faint); font-size: 10px; font-weight: 700; }
.nav-links a:hover, .nav-links a.router-link-active { color: var(--text-bright); }
.nav-links a.router-link-active .nav-num { color: var(--accent); }
.nav-links a::after {
  content: ''; position: absolute; left: 0; bottom: -4px;
  width: 100%; height: 1px; background: var(--text-bright);
  transform: scaleX(0); transform-origin: left;
  transition: transform .3s var(--ease-spring);
}
.nav-links a:hover::after, .nav-links a.router-link-active::after { transform: scaleX(1); }
.nav-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.btn-login { padding: 8px 18px; font: inherit; font-size: 14px; font-weight: 400; color: var(--text-bright); text-decoration: none; border: 1px solid var(--border-strong); border-radius: 4px; transition: color .25s, background-color .25s, border-color .25s, opacity .25s, transform .25s, box-shadow .25s(--ease-spring); }
.btn-login:hover { background: var(--text-bright); color: var(--bg); border-color: var(--text-bright); }
.btn-write { display: flex; align-items: center; gap: 6px; padding: 9px 18px; font: inherit; font-size: 14px; font-weight: 400; color: var(--bg); background: var(--text-bright); border-radius: 4px; text-decoration: none; transition: color .25s, background-color .25s, border-color .25s, opacity .25s, transform .25s, box-shadow .25s(--ease-spring); }
.btn-write:hover { background: var(--accent); color: var(--on-accent); }
.btn-write-icon { font-size: 15px; font-weight: 700; }
.user-menu-wrap { position: relative; }
.btn-user { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px; font: inherit; font-size: 12px; color: var(--text); background: var(--overlay-a4); border: 1px solid var(--border-strong); border-radius: 999px; cursor: pointer; transition: color 0.2s, background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.2s, box-shadow 0.2s; }
.btn-user:hover { border-color: var(--accent); background: var(--accent-a6); }
.user-name { font-weight: 500; color: var(--text-secondary); }
.user-caret { font-size: 10px; color: var(--text-muted); transition: transform 0.2s; }
.user-caret.open { transform: rotate(180deg); }
.user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; transform-origin: top right; min-width: 180px; background: var(--bg-float); border: 1px solid var(--border-strong); border-radius: 8px; overflow: hidden; box-shadow: 0 12px 40px var(--shadow); z-index: 200; }
.dropdown-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; font: inherit; font-size: 12px; font-weight: 500; color: var(--text-secondary); background: none; border: none; text-decoration: none; cursor: pointer; transition: color 0.15s, background-color 0.15s, border-color 0.15s, opacity 0.15s, transform 0.15s, box-shadow 0.15s; }
.dropdown-item.admin-link { color: var(--accent); border-bottom: 1px solid var(--border); }
.dropdown-item.admin-link:hover { background: var(--accent-a6); }
.dropdown-item.logout:hover { color: var(--err); }
.dropdown-icon { font-size: 13px; }
.nav-toggle { display: none; position: relative; z-index: 120; flex-direction: column; justify-content: center; align-items: center; gap: 4px; width: 34px; height: 34px; background: none; border: 1px solid var(--border-strong); border-radius: 6px; cursor: pointer; padding: 0; }
.nav-toggle span { display: block; width: 16px; height: 2px; background: var(--text-dim); border-radius: 1px; transition: transform 0.2s, opacity 0.2s; }
.nav-toggle.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
.nav-toggle.open span:nth-child(2) { opacity: 0; }
.nav-toggle.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
@media (max-width: 1000px) {
  .navbar-inner { gap: 18px; }
  .nav-links { gap: 16px; }
  .brand-path { display: none; }
}

@media (max-width: 800px) {
  .navbar-inner { padding: 0 16px; gap: 12px; }
  .brand-path { display: none; }
  /* 抽屉改成「从右滑入」：display 常驻 + translateX 位移，
     关闭时 visibility:hidden 一并把链接移出 tab 顺序与无障碍树。 */
  .nav-links {
    position: fixed; top: 0; right: 0; bottom: 0;
    display: flex; flex-direction: column; align-items: stretch; gap: 0;
    width: min(78vw, 300px);
    background: var(--bg); border-left: 1px solid var(--border);
    padding: 72px 20px 24px; z-index: 95;
    box-shadow: -8px 0 24px var(--shadow-soft);
    transform: translateX(100%); visibility: hidden;
    overscroll-behavior: contain;
    transition: transform .3s cubic-bezier(.32,.72,0,1), visibility .3s;
  }
  .nav-links::before {
    content: ''; position: fixed; inset: 0; background: var(--modal-overlay);
    opacity: 0; z-index: -1;
    transition: opacity .3s cubic-bezier(.32,.72,0,1);
  }
  .nav-links.open { transform: none; visibility: visible; }
  .nav-links.open::before { opacity: 1; }
  .nav-links a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 14px; }
  .nav-toggle { display: flex; flex: 0 0 34px; }
  /* 导航链接隐藏后失去 flex:1 的占位，动作区需要自己靠右 */
  .nav-actions { gap: 8px; margin-left: auto; }
  .user-name, .user-caret { display: none; }
}

/* 窄屏收紧：品牌与登录按钮各让一档，给汉堡按钮留出完整 34px */
@media (max-width: 480px) {
  .brand-text { font-size: 18px; }
  .nav-actions { gap: 6px; }
  .btn-login { padding: 7px 12px; font-size: 13px; }
}

/* 320–380：超窄屏保住搜索（入口一旦藏掉手机上就搜不了文章），
   改把登录按钮挪进抽屉；同时收紧内边距与品牌字号。 */
@media (max-width: 380px) {
  .navbar-inner { padding: 0 10px; gap: 6px; }
  .brand-text { font-size: 16px; }
  .btn-login { display: none; }
}
.nav-links .nav-drawer-auth { display: none; }
@media (max-width: 768px) {
  .nav-links .nav-drawer-auth { display: block; font-size: 14px; padding: 14px 6px 0; color: var(--accent); }
}
</style>
