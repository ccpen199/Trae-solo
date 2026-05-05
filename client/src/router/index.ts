import { createRouter, createWebHistory } from 'vue-router';
import { api } from '@/api';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '联盟首页' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', guest: true },
  },
  {
    path: '/create-union',
    name: 'CreateUnion',
    component: () => import('@/views/CreateUnion.vue'),
    meta: { title: '创建联盟', requiresAuth: true },
  },
  {
    path: '/union/:id',
    name: 'UnionDetail',
    component: () => import('@/views/UnionDetail.vue'),
    meta: { title: '联盟详情' },
  },
  {
    path: '/my-unions',
    name: 'MyUnions',
    component: () => import('@/views/MyUnions.vue'),
    meta: { title: '我的联盟', requiresAuth: true },
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/views/Ranking.vue'),
    meta: { title: '排行榜' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 猫扑联盟` : '猫扑联盟';
  
  const token = api.getToken();
  
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }
  
  if (to.meta.guest && token) {
    next({ name: 'Home' });
    return;
  }
  
  next();
});

export default router;
