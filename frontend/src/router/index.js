import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue')
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue')
  },
  {
    path: '/riders',
    name: 'Riders',
    component: () => import('@/views/Riders.vue')
  },
  {
    path: '/tracking',
    name: 'Tracking',
    component: () => import('@/views/Tracking.vue')
  },
  {
    path: '/tracking/:orderId',
    name: 'TrackingDetail',
    component: () => import('@/views/Tracking.vue')
  },
  {
    path: '/signature/:orderId',
    name: 'Signature',
    component: () => import('@/views/Signature.vue')
  },
  {
    path: '/enterprise',
    name: 'Enterprise',
    component: () => import('@/views/Enterprise.vue')
  },
  {
    path: '/archives',
    name: 'Archives',
    component: () => import('@/views/Archives.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
