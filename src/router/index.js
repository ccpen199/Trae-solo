import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Splash',
    component: () => import('@/views/Splash.vue'),
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/food',
    name: 'Food',
    component: () => import('@/views/Food.vue'),
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart.vue'),
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/User.vue'),
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
  },
  {
    path: '/location',
    name: 'Location',
    component: () => import('@/views/Location.vue'),
  },
  {
    path: '/video-detail/:id',
    name: 'VideoDetail',
    component: () => import('@/views/VideoDetail.vue'),
  },
  {
    path: '/coupon',
    name: 'Coupon',
    component: () => import('@/views/Coupon.vue'),
  },
  {
    path: '/activity/:type',
    name: 'Activity',
    component: () => import('@/views/Activity.vue'),
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
  },
  {
    path: '/address',
    name: 'Address',
    component: () => import('@/views/Address.vue'),
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
