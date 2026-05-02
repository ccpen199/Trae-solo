import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

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
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
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
        meta: { title: '资产登记' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/users/Messages.vue'),
        meta: { title: '待办消息' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/Reports.vue'),
        meta: { title: '报表中心' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth !== false && !userStore.token) {
    const token = localStorage.getItem('token')
    if (token) {
      userStore.token = token
      userStore.user = JSON.parse(localStorage.getItem('user') || 'null')
      next()
    } else {
      next('/login')
    }
  } else if (to.path === '/login' && userStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
