import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '仪表盘', requiresAuth: true },
  },
  {
    path: '/waybills',
    name: 'WaybillList',
    component: () => import('@/views/WaybillList.vue'),
    meta: { title: '运单列表', requiresAuth: true },
  },
  {
    path: '/waybills/:id',
    name: 'WaybillDetail',
    component: () => import('@/views/WaybillDetail.vue'),
    meta: { title: '运单详情', requiresAuth: true },
  },
  {
    path: '/waybills/create',
    name: 'WaybillCreate',
    component: () => import('@/views/WaybillCreate.vue'),
    meta: { title: '新建订舱', requiresAuth: true, roles: ['forwarder', 'admin'] },
  },
  {
    path: '/todos',
    name: 'TodoList',
    component: () => import('@/views/TodoList.vue'),
    meta: { title: '待办事项', requiresAuth: true },
  },
  {
    path: '/notifications',
    name: 'NotificationList',
    component: () => import('@/views/NotificationList.vue'),
    meta: { title: '通知消息', requiresAuth: true },
  },
  {
    path: '/audit-logs',
    name: 'AuditLogs',
    component: () => import('@/views/AuditLogs.vue'),
    meta: { title: '审计日志', requiresAuth: true, roles: ['admin'] },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

export function hasRequiredRole(requiredRoles?: string[]) {
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  if (user.role === 'admin') {
    return true;
  }
  return requiredRoles.includes(user.role);
}

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 航空货运管理系统` : '航空货运管理系统';

  if (to.meta.public) {
    if (to.path === '/login' && isAuthenticated()) {
      next('/dashboard');
      return;
    }
    next();
    return;
  }

  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login');
    return;
  }

  if (to.meta.roles && !hasRequiredRole(to.meta.roles as string[])) {
    next('/dashboard');
    return;
  }

  next();
});

export default router;
