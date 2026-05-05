import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册' },
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { title: '管理员后台', requiresAuth: true, requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/dashboard/index.vue'),
        meta: { title: '控制台' },
      },
      {
        path: 'users-pending',
        name: 'UsersPending',
        component: () => import('@/views/admin/users-pending/index.vue'),
        meta: { title: '未审核用户' },
      },
      {
        path: 'users-approved',
        name: 'UsersApproved',
        component: () => import('@/views/admin/users-approved/index.vue'),
        meta: { title: '已审核用户' },
      },
      {
        path: 'logistics',
        name: 'AdminLogistics',
        component: () => import('@/views/admin/logistics/index.vue'),
        meta: { title: '物流单管理' },
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/logs/index.vue'),
        meta: { title: '日志管理' },
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('@/views/admin/profile/index.vue'),
        meta: { title: '个人信息' },
      },
    ],
  },
  {
    path: '/enterprise',
    name: 'EnterpriseLayout',
    component: () => import('@/layouts/EnterpriseLayout.vue'),
    meta: { title: '企业端', requiresAuth: true, requiresEnterprise: true },
    redirect: '/enterprise/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'EnterpriseDashboard',
        component: () => import('@/views/enterprise/dashboard/index.vue'),
        meta: { title: '控制台' },
      },
      {
        path: 'logistics/create',
        name: 'LogisticsCreate',
        component: () => import('@/views/enterprise/logistics/create/index.vue'),
        meta: { title: '新增物流单' },
      },
      {
        path: 'logistics/upload',
        name: 'LogisticsUpload',
        component: () => import('@/views/enterprise/logistics/upload/index.vue'),
        meta: { title: '上传物流单' },
      },
      {
        path: 'logistics/:tab(production|initiator|transfer|receiver|unmatched)',
        name: 'LogisticsList',
        component: () => import('@/views/enterprise/logistics/list/index.vue'),
        meta: { title: '物流单列表' },
      },
      {
        path: 'profile',
        name: 'EnterpriseProfile',
        component: () => import('@/views/enterprise/profile/index.vue'),
        meta: { title: '个人信息' },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  document.title = `${to.meta.title || '物流信息交互平台'}`;

  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      next('/login');
      return;
    }

    if (!userStore.userInfo) {
      try {
        await userStore.getCurrentUser();
      } catch (e) {
        next('/login');
        return;
      }
    }

    if (to.meta.requiresAdmin && !userStore.isAdmin) {
      next('/login');
      return;
    }

    if (to.meta.requiresEnterprise && !userStore.isEnterprise) {
      next('/login');
      return;
    }
  }

  next();
});

export default router;
