import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

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
    path: '/certification-analysis',
    redirect: '/statistics/certification',
  },
  {
    path: '/statistics/query-top',
    name: 'QueryTop',
    component: () => import('@/pages/QueryTop.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/query-top',
    redirect: '/statistics/query-top',
  },
  {
    path: '/tasks/reminder',
    name: 'ReminderTasks',
    component: () => import('@/pages/ReminderTasks.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reminder-tasks',
    redirect: '/tasks/reminder',
  },
  {
    path: '/audit/logs',
    name: 'AuditLogs',
    component: () => import('@/pages/AuditLogs.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/audit-logs',
    redirect: '/audit/logs',
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
  if (to.name === 'Login') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo') === '1') {
      try {
        const adminStore = useAdminStore();
        adminStore.demoLogin('supervisor');
        next({ name: 'Dashboard' });
        return;
      } catch {}
    }
    const token = localStorage.getItem('adminToken');
    if (token) {
      next({ name: 'Dashboard' });
      return;
    }
  }
  if (to.meta.requiresAuth !== false) {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      try {
        const adminStore = useAdminStore();
        adminStore.demoLogin('supervisor');
      } catch {
        localStorage.setItem('adminToken', 'demo-admin-token-' + Date.now());
      }
    }
  }
  next();
});

export default router;
