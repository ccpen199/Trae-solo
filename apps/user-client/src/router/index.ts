import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'HomePage',
    component: () => import('@/pages/HomePage.vue'),
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: () => import('@/pages/AuthCallback.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/social-insurance',
    name: 'SocialInsurance',
    component: () => import('@/pages/SocialInsurance.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/survival-certification',
    name: 'SurvivalCertification',
    component: () => import('@/pages/SurvivalCertification.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/certification-history',
    name: 'CertificationHistory',
    component: () => import('@/pages/CertificationHistory.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/pages/Profile.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      try {
        const authStore = useAuthStore();
        authStore.demoLogin();
      } catch {
        localStorage.setItem('token', 'demo-access-token-' + Date.now());
      }
    }
  }
  next();
});

export default router;
