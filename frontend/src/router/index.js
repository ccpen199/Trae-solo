import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/rankings'
  },
  {
    path: '/rankings',
    name: 'Rankings',
    component: () => import('../views/Rankings.vue')
  },
  {
    path: '/ranking/:id',
    name: 'RankingDetail',
    component: () => import('../views/RankingDetail.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue')
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
