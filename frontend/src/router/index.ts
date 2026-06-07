import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'items',
        name: 'Items',
        component: () => import('@/views/Items.vue')
      },
      {
        path: 'items/:id',
        name: 'ItemDetail',
        component: () => import('@/views/ItemDetail.vue')
      },
      {
        path: 'applications',
        name: 'Applications',
        component: () => import('@/views/Applications.vue')
      },
      {
        path: 'applications/:id',
        name: 'ApplicationDetail',
        component: () => import('@/views/ApplicationDetail.vue')
      },
      {
        path: 'certificates',
        name: 'Certificates',
        component: () => import('@/views/Certificates.vue')
      },
      {
        path: 'seals',
        name: 'Seals',
        component: () => import('@/views/Seals.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'items',
        name: 'AdminItems',
        component: () => import('@/views/admin/Items.vue')
      },
      {
        path: 'standard',
        name: 'AdminStandard',
        component: () => import('@/views/admin/Standard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'bottlenecks',
        name: 'AdminBottlenecks',
        component: () => import('@/views/admin/Bottlenecks.vue')
      },
      {
        path: 'packages',
        name: 'AdminPackages',
        component: () => import('@/views/admin/Packages.vue')
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('@/views/admin/Logs.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token');
  const savedInfo = localStorage.getItem('userInfo');
  let userType: string | null = null;
  if (savedInfo) {
    try {
      userType = JSON.parse(savedInfo).userType;
    } catch {
      // ignore parse error
    }
  }

  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next(userType === 'admin' ? '/admin' : '/');
  } else if (to.meta.requiresAdmin && userType !== 'admin') {
    next('/');
  } else {
    next();
  }
});

export default router;
