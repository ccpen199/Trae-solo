import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Splash', component: () => import('@/views/Splash.vue') },
  { path: '/guide', name: 'Guide', component: () => import('@/views/Guide.vue') },
  { path: '/ad', name: 'Ad', component: () => import('@/views/Ad.vue') },
  { path: '/network-error', name: 'NetworkError', component: () => import('@/views/NetworkError.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') },
  { path: '/home', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/search', name: 'Search', component: () => import('@/views/Search.vue') },
  { path: '/search-result', name: 'SearchResult', component: () => import('@/views/SearchResult.vue') },
  { path: '/merchant/:id', name: 'Merchant', component: () => import('@/views/Merchant.vue') },
  { path: '/address', name: 'Address', component: () => import('@/views/Address.vue') },
  { path: '/add-address', name: 'AddAddress', component: () => import('@/views/AddAddress.vue') },
  { path: '/cart', name: 'Cart', component: () => import('@/views/Cart.vue') },
  { path: '/order', name: 'Order', component: () => import('@/views/Order.vue') },
  { path: '/order-detail/:id', name: 'OrderDetail', component: () => import('@/views/OrderDetail.vue') },
  { path: '/orders', name: 'Orders', component: () => import('@/views/Orders.vue') },
  { path: '/profile', name: 'Profile', component: () => import('@/views/Profile.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router