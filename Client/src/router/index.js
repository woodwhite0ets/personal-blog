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
    path: '/archive',
    name: 'Archive',
    component: () => import('../components/Homepage/ArchivePage.vue'),
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
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('../components/Admin/LogViewer.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ====== 路由守卫 ======
router.beforeEach((to, from, next) => {
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
        return next({ path: '/', query: { redirect: to.fullPath } });
      }
    } catch {
      // 无效 token 格式，清理后重定向
      clearStaleToken();
      return next({ path: '/', query: { redirect: to.fullPath } });
    }
  }

  // 2. 需登录路由
  if (to.meta.requiresAuth) {
    if (!token || isGuest()) {
      return next({ path: '/', query: { redirect: to.fullPath } });
    }
  }

  // 3. 需管理员路由
  if (to.meta.requiresAdmin) {
    if (!token || isGuest()) {
      return next({ path: '/', query: { redirect: to.fullPath } });
    }
    try {
      const payload = decodeTokenPayload(token);
      if (payload.role !== 'admin') {
        return next({ path: '/HomePage' });
      }
    } catch {
      return next({ path: '/', query: { redirect: to.fullPath } });
    }
  }

  next();
});

export default router;
