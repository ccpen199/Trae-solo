import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/statistics/certification',
    name: 'CertificationAnalysis',
    component: () => import('@/pages/CertificationAnalysis.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/statistics/query-top',
    name: 'QueryTop',
    component: () => import('@/pages/QueryTop.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/tasks/reminder',
    name: 'ReminderTasks',
    component: () => import('@/pages/ReminderTasks.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/audit/logs',
    name: 'AuditLogs',
    component: () => import('@/pages/AuditLogs.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/system/users',
    name: 'UserManagement',
    component: () => import('@/pages/UserManagement.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('adminToken');
  if (to.meta.requiresAuth !== false && !token) {
    next({ name: 'Login' });
  } else if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
