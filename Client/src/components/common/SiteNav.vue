<template>
  <header class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="brand" title="回到木白 · 公司主页" aria-label="木白，公司主页">
        <img class="brand-mark" src="/brand/opc-mark-color.svg" alt="" width="955" height="672" aria-hidden="true" />
        <span class="brand-text">{{ isCompany ? 'woodwhite' : 'woodwhite@blog' }}</span>
      </router-link>
      <router-link v-if="!isCompany" to="/" class="brand-back">← 木白</router-link>
      <nav ref="navLinksRef" class="nav-links" :class="{ open: navOpen }" @click="navOpen = false">
        <router-link v-for="l in navLinks" :key="l.to" :to="l.to"> {{ l.label }}
        </router-link>
        <template v-if="!isCompany">
          <router-link v-if="!isLoggedIn" to="/login" class="nav-drawer-auth">登录</router-link>
          <router-link v-else :to="`/user/${currentUser?.username}`" class="nav-drawer-auth">我的页面</router-link>
        </template>
      </nav>
      <div class="nav-actions">
        <ThemeSwitcher v-if="!isCompany" />
        <slot name="search" />
        <!-- 公司站：右端只有一个主行动（跟博客「新文章」同一个按钮配方） -->
        <a v-if="isCompany" class="btn-write" href="mailto:1903784785@qq.com">说说你的项目</a>
        <template v-else>
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
                管理面板
              </router-link>
              <router-link :to="`/user/${currentUser?.username}`" class="dropdown-item" @click="showUserMenu = false">
                我的页面
              </router-link>
              <button class="dropdown-item logout" @click="handleLogout">
                退出登录
              </button>
            </div>
            </Transition>
          </div>
        </template>
        </template>
      </div>
      <button ref="navToggleRef" class="nav-toggle" :class="{ open: navOpen }" @click="navOpen = !navOpen" aria-label="菜单" :aria-expanded="navOpen"><span></span><span></span><span></span></button>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import UserAvatar from './UserAvatar.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { useAuth } from '../../stores/auth.js'

const props = defineProps({
  // blog＝博客顶栏；company＝公司站顶栏（同一套尺寸/材质，只换链接与行动区）
  variant: { type: String, default: 'blog' },
})
const isCompany = computed(() => props.variant === 'company')

const route = useRoute()
const { currentUser, isLoggedIn, isAdmin, logout } = useAuth()

const blogLinks = [
  { to: '/blog', label: '首页' },
  { to: '/forum', label: '文章' },
  { to: '/ai-daily', label: 'AI 榜' },
  { to: '/tools', label: '工具' },
  { to: '/projects', label: '项目' },
  { to: '/now', label: '现在' },
  { to: '/about', label: '关于' },
]
const companyLinks = [
  { to: '/', label: '首页' },
  { to: '/work', label: '案例' },
  { to: '/stack', label: '能力' },
  { to: '/contact', label: '联系' },
  { to: '/blog', label: '博客' },
]
const navLinks = computed(() => (isCompany.value ? companyLinks : blogLinks))

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
const navLinksRef = ref(null)
const navToggleRef = ref(null)

function handleLogout() {
  showUserMenu.value = false
  logout()
}

function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) showUserMenu.value = false
  if (!navOpen.value) return
  // 抽屉在手机上铺满右侧，点遮罩就是点到这儿：收起
  if (navLinksRef.value?.contains(e.target)) return
  if (navToggleRef.value?.contains(e.target)) return
  navOpen.value = false
}

function handleKeydown(e) {
  if (e.key === 'Escape' && navOpen.value) {
    navOpen.value = false
    navToggleRef.value?.focus() // 焦点回到触发按钮，别丢在页面顶上
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
// 抽屉打开后把焦点送进菜单；否则 Tab 会跳过它（抽屉在 DOM 里排在汉堡按钮之前）
watch(navOpen, async (open) => {
  if (!open) return
  await nextTick()
  // 抽屉靠 visibility 显隐，样式生效后再聚焦，否则 focus() 会被忽略
  requestAnimationFrame(() => { navLinksRef.value?.querySelector('a')?.focus() })
})
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
.brand { display: flex; align-items: baseline; gap: 4px; flex-shrink: 0; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
.brand-bracket { color: var(--text-muted); }
.brand-text { font-family: "EB Garamond Variable", "Noto Serif SC", Georgia, serif; font-size: 1.375rem; letter-spacing: -0.01em; color: var(--text-bright); white-space: nowrap; }
.brand-caret { color: var(--accent); font-size: 0.75rem; margin-left: 1px; }
.brand-path { color: var(--text-dim); margin-left: 8px; font-size: 0.75rem; }
.nav-links { display: flex; gap: 28px; flex: 1; }
.nav-links a { display: flex; align-items: center; gap: 6px; text-decoration: none; font-size: 0.9375rem; font-weight: 400; color: var(--text-secondary); transition: color var(--dur-hover) var(--ease-out); position: relative; white-space: nowrap; }
.nav-num { color: var(--text-faint); font-size: 0.625rem; font-weight: 700; }
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
.btn-login { padding: 8px 18px; font: inherit; font-size: 0.875rem; font-weight: 400; color: var(--text-bright); text-decoration: none; border: 1px solid var(--border-strong); border-radius: 4px; transition: color .25s, background-color .25s, border-color .25s, opacity .25s, transform .25s, box-shadow .25s(--ease-spring); }
.btn-login:hover { background: var(--text-bright); color: var(--bg); border-color: var(--text-bright); }
.btn-write { display: flex; align-items: center; gap: 6px; padding: 9px 18px; font: inherit; font-size: 0.875rem; font-weight: 400; color: var(--bg); background: var(--text-bright); border-radius: 4px; text-decoration: none; transition: color .25s, background-color .25s, border-color .25s, opacity .25s, transform .25s, box-shadow .25s(--ease-spring); }
.btn-write:hover { background: var(--accent); color: var(--on-accent); }
.btn-write-icon { font-size: 0.9375rem; font-weight: 700; }
.user-menu-wrap { position: relative; }
.btn-user { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px; font: inherit; font-size: 0.75rem; color: var(--text); background: var(--overlay-a4); border: 1px solid var(--border-strong); border-radius: 999px; cursor: pointer; transition: color 0.2s, background-color 0.2s, border-color 0.2s, opacity 0.2s, transform 0.2s, box-shadow 0.2s; }
.btn-user:hover { border-color: var(--accent); background: var(--accent-a6); }
.user-name { font-weight: 500; color: var(--text-secondary); }
.user-caret { font-size: 0.625rem; color: var(--text-muted); transition: transform 0.2s; }
.user-caret.open { transform: rotate(180deg); }
.user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; transform-origin: top right; min-width: 180px; background-color: var(--bg-float); border: 1px solid var(--border-strong); border-radius: 8px; overflow: hidden; box-shadow: 0 12px 40px var(--shadow); z-index: 200; }
.dropdown-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 14px; font: inherit; font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); background: none; border: none; text-decoration: none; cursor: pointer; transition: color 0.15s, background-color 0.15s, border-color 0.15s, opacity 0.15s, transform 0.15s, box-shadow 0.15s; }
.dropdown-item.admin-link { color: var(--accent); border-bottom: 1px solid var(--border); }
.dropdown-item.admin-link:hover { background: var(--accent-a6); }
.dropdown-item.logout:hover { color: var(--err); }
.dropdown-icon { font-size: 0.8125rem; }
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

@media (max-width: 1000px) {
  .navbar-inner { padding: 0 16px; gap: 12px; }
  .brand-path { display: none; }
  /* 抽屉改成「从右滑入」：display 常驻 + translateX 位移，
     关闭时 visibility:hidden 一并把链接移出 tab 顺序与无障碍树。 */
  .nav-links {
    position: fixed; top: 0; right: 0; bottom: 0;
    display: flex; flex-direction: column; align-items: stretch; gap: 0;
    width: min(78vw, 300px);
    background-color: var(--bg); border-left: 1px solid var(--border);
    padding: 72px 20px 24px; z-index: 95;
    box-shadow: -8px 0 24px var(--shadow-soft);
    transform: translateX(100%); visibility: hidden;
    overscroll-behavior: contain;
    /* 打开时立刻可见（首帧仍 hidden 时 focus() 会被浏览器拒绝）；关闭时等滑出结束再隐藏 */
    transition: transform .3s cubic-bezier(.32,.72,0,1), visibility 0s linear .3s;
  }
  .nav-links::before {
    content: ''; position: fixed; inset: 0; background: var(--modal-overlay);
    opacity: 0; z-index: -1;
    transition: opacity .3s cubic-bezier(.32,.72,0,1);
  }
  .nav-links.open { transform: none; visibility: visible; transition: transform .3s cubic-bezier(.32,.72,0,1), visibility 0s; }
  .nav-links.open::before { opacity: 1; }
  .nav-links a { padding: 14px 6px; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
  .nav-toggle { display: flex; flex: 0 0 34px; }
  /* 只有进入抽屉模式才允许品牌名让位：先收缩、必要时省略，
     宽度下限保证「woodwhite…」至少能看到几个字，而不是只剩一个省略号 */
  .brand { flex-shrink: 1; min-width: 0; }
  .brand-text { overflow: hidden; text-overflow: ellipsis; min-width: 9ch; }
  /* 导航链接隐藏后失去 flex:1 的占位，动作区需要自己靠右 */
  .nav-actions { gap: 8px; margin-left: auto; }
  .user-name, .user-caret { display: none; }
}

/* 窄屏收紧：品牌与登录按钮各让一档，给汉堡按钮留出完整 34px */
@media (max-width: 480px) {
  .brand-text { font-size: 1.125rem; }
  .nav-actions { gap: 6px; }
  .btn-login { padding: 7px 12px; font-size: 0.8125rem; }
}

/* 320–380：超窄屏保住搜索（入口一旦藏掉手机上就搜不了文章），
   改把登录按钮挪进抽屉；同时收紧内边距与品牌字号。 */
@media (max-width: 380px) {
  .navbar-inner { padding: 0 10px; gap: 6px; }
  .brand-text { font-size: 1rem; }
  .btn-login { display: none; }
}
.nav-links .nav-drawer-auth { display: none; }
@media (max-width: 768px) {
  .nav-links .nav-drawer-auth { display: block; font-size: 0.875rem; padding: 14px 6px 0; color: var(--accent); }
}
</style>
