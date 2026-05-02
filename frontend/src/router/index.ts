import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'assets',
        name: 'AssetList',
        component: () => import('@/views/AssetList.vue')
      },
      {
        path: 'assets/:masterId',
        name: 'AssetDetail',
        component: () => import('@/views/AssetDetail.vue')
      },
      {
        path: 'register',
        name: 'AssetRegister',
        component: () => import('@/views/AssetRegister.vue')
      },
      {
        path: 'workflow',
        name: 'Workflow',
        component: () => import('@/views/Workflow.vue')
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/Inventory.vue')
      },
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('@/views/Approval.vue')
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/Messages.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  
  if (!authStore.isAuthenticated) {
    authStore.initUser();
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
