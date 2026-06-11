import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('@/views/Services.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/service/:code',
    name: 'ServiceDetail',
    component: () => import('@/views/ServiceDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/news',
    name: 'News',
    component: () => import('@/views/News.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/news/:id',
    name: 'NewsDetail',
    component: () => import('@/views/NewsDetail.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/archives',
    name: 'Archives',
    component: () => import('@/views/Archives.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/notifications',
    name: 'Notifications',
    component: () => import('@/views/Notifications.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/authorizations',
    name: 'Authorizations',
    component: () => import('@/views/Authorizations.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/records',
    name: 'ServiceRecords',
    component: () => import('@/views/ServiceRecords.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/audit',
    name: 'AuditLogs',
    component: () => import('@/views/AuditLogs.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/auth',
    name: 'ProfileAuth',
    component: () => import('@/views/ProfileAuth.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/stepup',
    name: 'StepUpAuth',
    component: () => import('@/views/StepUpAuth.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else if (!userStore.tokenValidated) {
      const valid = await userStore.validateToken();
      if (valid) {
        next();
      } else {
        next({ path: '/login', query: { redirect: to.fullPath } });
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
