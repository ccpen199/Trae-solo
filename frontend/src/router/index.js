import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search/index.vue'),
    meta: { title: '搜索' }
  },
  {
    path: '/category/:categoryId',
    name: 'Category',
    component: () => import('@/views/Category/index.vue'),
    meta: { title: '分类' }
  },
  {
    path: '/product/:productId',
    name: 'Product',
    component: () => import('@/views/Product/index.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart/index.vue'),
    meta: { title: '购物车', requiresAuth: true }
  },
  {
    path: '/address',
    name: 'AddressList',
    component: () => import('@/views/Address/index.vue'),
    meta: { title: '收货地址', requiresAuth: true }
  },
  {
    path: '/address/add',
    name: 'AddressAdd',
    component: () => import('@/views/Address/edit.vue'),
    meta: { title: '新增地址', requiresAuth: true }
  },
  {
    path: '/address/edit/:id',
    name: 'AddressEdit',
    component: () => import('@/views/Address/edit.vue'),
    meta: { title: '编辑地址', requiresAuth: true }
  },
  {
    path: '/order',
    name: 'Order',
    component: () => import('@/views/Order/index.vue'),
    meta: { title: '我的订单', requiresAuth: true }
  },
  {
    path: '/order/:orderId',
    name: 'OrderDetail',
    component: () => import('@/views/Order/detail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('@/views/Checkout/index.vue'),
    meta: { title: '确认订单', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/index.vue'),
    meta: { title: '我的' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '每日鲜鲜';
  
  const userStore = useUserStore();
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else {
    next();
  }
});

export default router;
