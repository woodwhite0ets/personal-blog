import { createRouter, createWebHistory } from 'vue-router';
import { getToken, isGuest } from '../stores/auth.js';

// 安全解码 JWT payload（兼容 base64url 的 - _ 字符）
function decodeTokenPayload(token) {
  const payload = token.split('.')[1];
  const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return JSON.parse(atob(b64 + pad));
}

function clearStaleToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('token_expires');
  localStorage.removeItem('remember_me');
  localStorage.removeItem('guest_mode');
  localStorage.removeItem('guest_user');
  sessionStorage.clear();
}

// 公司站只认这几个路径，其余都属于博客
const COMPANY_PATHS = ['/solutions', '/work', '/stack', '/contact']

const routes = [
  {
    path: '/',
    name: 'CompanyHome',
    component: () => import('../components/Company/CompanyHome.vue'),
  },
  {
    // 博客首页：新规范路径
    path: '/blog',
    name: 'BlogHome',
    component: () => import('../components/Homepage/Homepage.vue'),
  },
  {
    // 旧路径保留，永久跳到 /blog（站内还有大量历史链接指向这里）
    path: '/HomePage',
    redirect: '/blog',
  },
  {
    // 营销内容已并入首页
    path: '/solutions',
    redirect: '/',
  },
  {
    path: '/work',
    name: 'CompanyWork',
    component: () => import('../components/Company/CompanyWork.vue'),
  },
  {
    path: '/stack',
    name: 'CompanyStack',
    component: () => import('../components/Company/CompanyStack.vue'),
  },
  {
    path: '/contact',
    name: 'CompanyContact',
    component: () => import('../components/Company/CompanyContact.vue'),
  },
  {
    path: '/login',
    name: 'LoginPage',
    component: () => import('../components/Login/Login.vue'),
  },
  {
    path: '/RegisterPage',
    name: 'RegisterPage',
    component: () => import('../components/Login/Register.vue'),
  },

  {
    path: '/post/:slug',
    name: 'PostDetail',
    component: () => import('../components/Post/PostDetail.vue'),
  },
  {
    path: '/forum',
    name: 'Forum',
    component: () => import('../components/Homepage/ForumPage.vue'),
  },
  {
    path: '/ai-daily',
    name: 'AIDaily',
    component: () => import('../components/AIDaily/AIDailyPage.vue'),
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('../components/Tools/ToolsPage.vue'),
  },
  {
    path: '/tools/:slug',
    name: 'ToolDetail',
    component: () => import('../components/Tools/ToolDetail.vue'),
  },
  {
    path: '/now',
    name: 'Now',
    component: () => import('../components/Homepage/NowPage.vue'),
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../components/Projects/ProjectsPage.vue'),
  },
  {
    path: '/projects/:slug',
    name: 'ProjectDetail',
    component: () => import('../components/Projects/ProjectDetail.vue'),
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('../components/Homepage/NotesPage.vue'),
  },
  {
    path: '/series/:name',
    name: 'Series',
    component: () => import('../components/Homepage/SeriesPage.vue'),
  },
  {
    path: '/archive',
    name: 'Archive',
    component: () => import('../components/Homepage/ArchivePage.vue'),
  },
  {
    path: '/tags',
    name: 'Tags',
    component: () => import('../components/Homepage/TagsPage.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../components/Homepage/AboutPage.vue'),
  },
  {
    path: '/user/:username',
    name: 'UserPage',
    component: () => import('../components/User/UserPage.vue'),
  },
  {
    path: '/verify-email/:token',
    name: 'VerifyEmail',
    component: () => import('../components/Login/VerifyEmail.vue'),
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../components/Login/ForgotPassword.vue'),
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: () => import('../components/Login/ResetPassword.vue'),
  },
  {
    path: '/editor',
    name: 'EditorNew',
    component: () => import('../components/Editor/EditorPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/editor/:slug',
    name: 'EditorEdit',
    component: () => import('../components/Editor/EditorPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('../components/Admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../components/Admin/Dashboard.vue'),
      },
      {
        path: 'posts',
        name: 'AdminPosts',
        component: () => import('../components/Admin/PostsManager.vue'),
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../components/Admin/UsersManager.vue'),
      },
      {
        path: 'tools',
        name: 'AdminTools',
        component: () => import('../components/Admin/ToolsManager.vue'),
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('../components/Admin/LogViewer.vue'),
      },
    ],
  },  // 404：未知路径
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../components/NotFound.vue'),
  },
];

// 本次文档加载是刷新还是直接打开（用于决定"刷新时忽略 URL 里的 #锚点"）
const navType = (() => {
  try { return performance.getEntriesByType('navigation')[0]?.type || 'navigate' } catch { return 'navigate' }
})()
const isReload = navType === 'reload'
let firstNavDone = false

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 刷新时忽略 URL 里的 #锚点：否则停在页脚点过「常见问题」再刷新，会被带到 FAQ 那一屏
    const ignoreHash = isReload && !firstNavDone;
    // 带 #锚点 时滚到目标元素，留出固定导航栏高度
    if (to.hash && !ignoreHash) return { el: to.hash, top: 84 };
    // 前进/后退：vue-router 会给出该条历史记录上次的滚动位置。这里不让它自己滚
    // （它在页面过渡中滚，文档还没撑开高度，会被夹成很小一个值），改由 afterEach 补偿落位。
    if (savedPosition && typeof savedPosition.top === 'number') {
      scheduleRestore(savedPosition.top);
      return false;
    }
    // 刷新 / 直接打开 / 站内跳转：一律回顶部
    return { top: 0 };
  },
});

// ====== 路由守卫 ======
// 恢复滚动位置：等页面渲染 + 过渡结束后再落位，并在之后补几次（过渡期间文档还矮，会滚不到位）
function scheduleRestore(y) {
  const apply = () => window.scrollTo({ left: 0, top: y, behavior: 'auto' });
  requestAnimationFrame(apply);
  for (const delay of [140, 320, 650, 1100]) {
    setTimeout(() => { if (Math.abs(window.scrollY - y) > 4) apply(); }, delay);
  }
}

router.beforeEach((to, from, next) => {
  // 两个域名各管各的，互相跳转，避免同一内容出现在两个域下（重复内容/权重分散）
  const host = window.location.hostname
  const onBlog = host.startsWith('blog.')
  const onCompany = host === 'woodwhite.top' || host === 'www.woodwhite.top'
  if (onBlog || onCompany) {
    const p = to.path
    const companyPath = p === '/' || COMPANY_PATHS.some((x) => p === x || p.startsWith(x + '/'))
    if (onBlog && companyPath) { window.location.replace(`https://woodwhite.top${p === '/' ? '/' : p}`); return }
    if (onCompany && !companyPath) { window.location.replace(`https://blog.woodwhite.top${p}`); return }
  }
  const token = getToken();

  // 1. 过期 token 快速清理
  if (token) {
    try {
      const payload = decodeTokenPayload(token);
      if (payload.exp && Date.now() > payload.exp * 1000) {
        localStorage.removeItem('token');
        localStorage.removeItem('token_expires');
        localStorage.removeItem('remember_me');
        localStorage.removeItem('guest_mode');
        localStorage.removeItem('guest_user');
        sessionStorage.clear();
        return next({ path: '/login', query: { redirect: to.fullPath } });
      }
    } catch {
      // 无效 token 格式，清理后重定向
      clearStaleToken();
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }

  // 2. 需登录路由
  if (to.meta.requiresAuth) {
    if (!token || isGuest()) {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }

  // 3. 需管理员路由
  if (to.meta.requiresAdmin) {
    if (!token || isGuest()) {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
    try {
      const payload = decodeTokenPayload(token);
      if (payload.role !== 'admin') {
        return next({ path: '/HomePage' });
      }
    } catch {
      return next({ path: '/login', query: { redirect: to.fullPath } });
    }
  }

  next();
});

export default router;
