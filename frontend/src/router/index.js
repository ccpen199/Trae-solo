import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/home/Home.vue'),
    meta: { title: '首页', requiresAuth: false }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/product/ProductDetail.vue'),
    meta: { title: '商品详情', requiresAuth: false }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/product/Search.vue'),
    meta: { title: '搜索商品', requiresAuth: false }
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import('../views/product/Category.vue'),
    meta: { title: '分类', requiresAuth: false }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/product/Cart.vue'),
    meta: { title: '购物车', requiresAuth: true }
  },
  {
    path: '/fuel',
    name: 'Fuel',
    component: () => import('../views/fuel/Fuel.vue'),
    meta: { title: '一键加油', requiresAuth: true }
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('../views/fuel/Wallet.vue'),
    meta: { title: '加油钱包', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/user/Profile.vue'),
    meta: { title: '我的', requiresAuth: false }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/user/Orders.vue'),
    meta: { title: '我的订单', requiresAuth: true }
  },
  {
    path: '/coupons',
    name: 'Coupons',
    component: () => import('../views/user/Coupons.vue'),
    meta: { title: '优惠券', requiresAuth: true }
  },
  {
    path: '/invite',
    name: 'Invite',
    component: () => import('../views/user/Invite.vue'),
    meta: { title: '推荐有奖', requiresAuth: true }
  },
  {
    path: '/points-exchange',
    name: 'PointsExchange',
    component: () => import('../views/user/PointsExchange.vue'),
    meta: { title: '积分兑换', requiresAuth: true }
  },
  {
    path: '/station/:id',
    name: 'StationDetail',
    component: () => import('../views/fuel/StationDetail.vue'),
    meta: { title: '油站详情', requiresAuth: false }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('../views/home/ArticleDetail.vue'),
    meta: { title: '文章详情', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  document.title = to.meta.title ? `${to.meta.title} - 易捷加油` : '易捷加油'

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
