import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

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
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next({ name: 'HomePage' });
  } else {
    next();
  }
});

export default router;
