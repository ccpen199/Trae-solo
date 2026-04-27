import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store';
import { UserRole } from '@/types';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '实时看板' },
      },
      {
        path: 'work-orders',
        name: 'WorkOrders',
        component: () => import('@/views/work-order/List.vue'),
        meta: { title: '工单管理' },
      },
      {
        path: 'work-orders/create',
        name: 'CreateWorkOrder',
        component: () => import('@/views/work-order/Create.vue'),
        meta: { title: '创建工单', roles: [UserRole.PLANNER] },
      },
      {
        path: 'work-orders/:id',
        name: 'WorkOrderDetail',
        component: () => import('@/views/work-order/Detail.vue'),
        meta: { title: '工单详情' },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/report/List.vue'),
        meta: { title: '生产报工' },
      },
      {
        path: 'quality',
        name: 'Quality',
        component: () => import('@/views/quality/List.vue'),
        meta: { title: '质量检验' },
      },
      {
        path: 'quality/create',
        name: 'CreateInspection',
        component: () => import('@/views/quality/Create.vue'),
        meta: { title: '创建检验', roles: [UserRole.QUALITY_INSPECTOR, UserRole.MANAGER] },
      },
      {
        path: 'abnormals',
        name: 'Abnormals',
        component: () => import('@/views/abnormal/List.vue'),
        meta: { title: '异常管理' },
      },
      {
        path: 'abnormals/create',
        name: 'CreateAbnormal',
        component: () => import('@/views/abnormal/Create.vue'),
        meta: { title: '上报异常' },
      },
      {
        path: 'yield-analysis',
        name: 'YieldAnalysis',
        component: () => import('@/views/yield/Analysis.vue'),
        meta: { title: '良率分析' },
      },
      {
        path: 'operation-logs',
        name: 'OperationLogs',
        component: () => import('@/views/operation-logs/List.vue'),
        meta: { title: '操作日志', roles: [UserRole.MANAGER] },
      },
      {
        path: 'production-history',
        name: 'ProductionHistory',
        component: () => import('@/views/production-history/List.vue'),
        meta: { title: '生产履历' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();
  document.title = to.meta?.title ? `${to.meta.title} - MES 生产执行系统` : 'MES 生产执行系统';

  if (to.meta.requiresAuth === false) {
    if (to.path === '/login' && userStore.isAuthenticated) {
      next('/');
    } else {
      next();
    }
    return;
  }

  if (!userStore.isAuthenticated) {
    next('/login');
    return;
  }

  if (!userStore.user) {
    userStore.restoreSession();
  }

  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const hasPermission = userStore.hasRole(to.meta.roles as UserRole[]);
    if (!hasPermission) {
      next('/dashboard');
      return;
    }
  }

  next();
});

export default router;
