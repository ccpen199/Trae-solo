import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页', keepAlive: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue'),
    meta: { title: '搜索' }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import('../views/Category.vue'),
    meta: { title: '分类', keepAlive: true }
  },
  {
    path: '/content',
    name: 'Content',
    component: () => import('../views/Content.vue'),
    meta: { title: '微淘', keepAlive: true }
  },
  {
    path: '/content/:id',
    name: 'ContentDetail',
    component: () => import('../views/ContentDetail.vue'),
    meta: { title: '内容详情' }
  },
  {
    path: '/message',
    name: 'Message',
    component: () => import('../views/Message.vue'),
    meta: { title: '消息', requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue'),
    meta: { title: '购物车', requiresAuth: true }
  },
  {
    path: '/order',
    name: 'Order',
    component: () => import('../views/Order.vue'),
    meta: { title: '我的订单', requiresAuth: true }
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('../views/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout.vue'),
    meta: { title: '确认订单', requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/Favorites.vue'),
    meta: { title: '我的收藏', requiresAuth: true }
  },
  {
    path: '/chat/:shopId',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    meta: { title: '客服', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '我的' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/recharge',
    name: 'Recharge',
    component: () => import('../views/Recharge.vue'),
    meta: { title: '充值中心' }
  },
  {
    path: '/supermarket',
    name: 'Supermarket',
    component: () => import('../views/Supermarket.vue'),
    meta: { title: '天猫超市' }
  },
  {
    path: '/live',
    name: 'Live',
    component: () => import('../views/Live.vue'),
    meta: { title: '淘宝直播' }
  },
  {
    path: '/juhuasuan',
    name: 'Juhuasuan',
    component: () => import('../views/Juhuasuan.vue'),
    meta: { title: '聚划算' }
  },
  {
    path: '/subsidy',
    name: 'Subsidy',
    component: () => import('../views/Subsidy.vue'),
    meta: { title: '百亿补贴' }
  },
  {
    path: '/good-stuff',
    name: 'GoodStuff',
    component: () => import('../views/GoodStuff.vue'),
    meta: { title: '有好货' }
  },
  {
    path: '/sale',
    name: 'Sale',
    component: () => import('../views/Sale.vue'),
    meta: { title: '天天特卖' }
  },
  {
    path: '/alihealth',
    name: 'AliHealth',
    component: () => import('../views/AliHealth.vue'),
    meta: { title: '阿里健康' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }
  
  if (to.meta.title) {
    document.title = to.meta.title + ' - 淘宝商城';
  }
  
  next();
});

export default router;
