import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/menu',
  },
  {
    path: '/scan',
    name: 'Scan',
    component: () => import('@/views/scan/ScanView.vue'),
    meta: { requiresTable: false },
  },
  {
    path: '/menu',
    name: 'Menu',
    component: () => import('@/views/menu/MenuView.vue'),
    meta: { requiresTable: true },
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/cart/CartView.vue'),
    meta: { requiresTable: true },
  },
  {
    path: '/order',
    name: 'Order',
    component: () => import('@/views/order/OrderView.vue'),
    meta: { requiresTable: true },
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('@/views/order/OrderDetailView.vue'),
    meta: { requiresTable: true },
  },
  {
    path: '/payment',
    name: 'Payment',
    component: () => import('@/views/payment/PaymentView.vue'),
    meta: { requiresTable: true },
  },
  {
    path: '/success',
    name: 'Success',
    component: () => import('@/views/success/SuccessView.vue'),
    meta: { requiresTable: false },
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('@/views/review/ReviewView.vue'),
    meta: { requiresTable: false },
  },
  {
    path: '/member',
    name: 'Member',
    component: () => import('@/views/member/MemberView.vue'),
    meta: { requiresTable: false },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
