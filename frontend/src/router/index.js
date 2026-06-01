import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '../stores/user';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue'), meta: { requiresAuth: true } },
  { path: '/sops', component: () => import('../views/SOPList.vue'), meta: { requiresAuth: true } },
  { path: '/sops/:id', component: () => import('../views/SOPDetail.vue'), meta: { requiresAuth: true } },
  { path: '/sops/create', component: () => import('../views/SOPEdit.vue'), meta: { requiresAuth: true } },
  { path: '/sops/:id/edit', component: () => import('../views/SOPEdit.vue'), meta: { requiresAuth: true } },
  { path: '/work-orders', component: () => import('../views/WorkOrderList.vue'), meta: { requiresAuth: true } },
  { path: '/work-orders/create', component: () => import('../views/WorkOrderEdit.vue'), meta: { requiresAuth: true } },
  { path: '/work-execution', component: () => import('../views/WorkExecution.vue'), meta: { requiresAuth: true } },
  { path: '/work-execution/:orderId', component: () => import('../views/ProcessExecution.vue'), meta: { requiresAuth: true } },
  { path: '/change-notifications', component: () => import('../views/ChangeNotifications.vue'), meta: { requiresAuth: true } },
  { path: '/products', component: () => import('../views/Products.vue'), meta: { requiresAuth: true } },
  { path: '/processes', component: () => import('../views/Processes.vue'), meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.currentUser) {
    next('/login');
  } else if (to.path === '/login' && userStore.currentUser) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
