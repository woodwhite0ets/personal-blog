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

const routes = [
  {
    path: '/',
    name: 'CompanyHome',
    component: () => import('../components/Company/CompanyHome.vue'),
  },
  {
    // 博客首页仍走原路径，公司页的「博客」入口指这里
    path: '/blog',
    redirect: '/HomePage',
  },
  {
    path: '/solutions',
    name: 'CompanySolutions',
    component: () => import('../components/Company/CompanySolutions.vue'),
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
    path: '/HomePage',
    name: 'HomePage',
    component: () => import('../components/Homepage/Homepage.vue'),
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

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    // 带 #锚点 时滚到目标元素，留出固定导航栏高度
    if (to.hash) return { el: to.hash, top: 84, behavior: 'smooth' };
    return { top: 0 };
  },
});

// ====== 路由守卫 ======
router.beforeEach((to, from, next) => {
  // 按 hostname 分流：blog 子域进来落博客，根域落公司主页
  if (to.path === '/' && window.location.hostname.startsWith('blog.')) {
    next('/HomePage')
    return
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
