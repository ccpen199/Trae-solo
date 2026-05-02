import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLES } from '@/utils/constants'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/orders',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: '订单列表' }
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/orders/OrderCreate.vue'),
        meta: { title: '创建订单', roles: [ROLES.CONSUMER, ROLES.OPERATOR] }
      },
      {
        path: 'orders/:orderId',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'orders/:orderId/process',
        name: 'OrderProcess',
        component: () => import('@/views/orders/OrderProcess.vue'),
        meta: { title: '处理订单' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '消息通知' }
      },
      {
        path: 'corrections',
        name: 'Corrections',
        component: () => import('@/views/Corrections.vue'),
        meta: { title: '冲正记录', roles: [ROLES.OPERATOR] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn

  if (to.meta.requiresAuth !== false && !isLoggedIn) {
    next('/login')
    return
  }

  if (to.path === '/login' && isLoggedIn) {
    next('/orders')
    return
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(authStore.role) && authStore.role !== ROLES.OPERATOR) {
      next('/orders')
      return
    }
  }

  next()
})

export default router
