import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '../store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '仪表盘', requiresAuth: true }
  },
  {
    path: '/order/create',
    name: 'CreateOrder',
    component: () => import('../views/CreateOrder.vue'),
    meta: { title: '叫车', requiresAuth: true }
  },
  {
    path: '/order/:orderId',
    name: 'OrderDetail',
    component: () => import('../views/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('../views/OrderList.vue'),
    meta: { title: '订单列表', requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 网约车派单系统` : '网约车派单系统';

  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
    return;
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(userStore.user?.role)) {
      next({ name: 'Dashboard' });
      return;
    }
  }

  if (to.name === 'Login' && userStore.isLoggedIn) {
    next({ name: 'Dashboard' });
    return;
  }

  next();
});

export default router;
