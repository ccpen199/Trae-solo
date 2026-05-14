import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetail.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue')
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order-success',
    name: 'OrderSuccess',
    component: () => import('../views/OrderSuccess.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/Orders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('../views/Orders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/favorite',
    name: 'Favorite',
    component: () => import('../views/Favorite.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/follow',
    name: 'Follow',
    component: () => import('../views/Follow.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/live/:id',
    name: 'LiveRoom',
    component: () => import('../views/LiveRoom.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/orchard',
    name: 'Orchard',
    component: () => import('../views/ActivityPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bargain',
    name: 'Bargain',
    component: () => import('../views/ActivityPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cash',
    name: 'Cash',
    component: () => import('../views/ActivityPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game',
    name: 'Game',
    component: () => import('../views/ActivityPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/coupon',
    name: 'Coupon',
    component: () => import('../views/ActivityPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/address',
    name: 'Address',
    component: () => import('../views/Address.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue')
  },
  {
    path: '/chat',
    name: 'ChatList',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:sessionId',
    name: 'ChatRoom',
    component: () => import('../views/ChatRoom.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const protectedPaths = [
    '/cart', '/checkout', '/orders', '/order', '/favorite', '/follow',
    '/orchard', '/bargain', '/cash', '/game', '/coupon', '/address', '/chat', '/contact'
  ]
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (protectedPaths.some(p => to.path.startsWith(p)) && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  next()
})

export default router
