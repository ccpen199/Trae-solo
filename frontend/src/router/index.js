import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/merchants', component: () => import('../views/Merchants.vue') },
  { path: '/products', component: () => import('../views/Products.vue') },
  { path: '/customers', component: () => import('../views/Customers.vue') },
  { path: '/orders', component: () => import('../views/Orders.vue') },
  { path: '/orders/:id', component: () => import('../views/OrderDetail.vue') },
  { path: '/order-create', component: () => import('../views/OrderCreate.vue') },
  { path: '/disputes', component: () => import('../views/Disputes.vue') },
  { path: '/transactions', component: () => import('../views/Transactions.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
