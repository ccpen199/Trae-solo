import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/leaders',
    name: 'Leaders',
    component: () => import('../views/Leaders.vue')
  },
  {
    path: '/activities',
    name: 'Activities',
    component: () => import('../views/Activities.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue')
  },
  {
    path: '/commissions',
    name: 'Commissions',
    component: () => import('../views/Commissions.vue')
  },
  {
    path: '/aftersales',
    name: 'AfterSales',
    component: () => import('../views/AfterSales.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
