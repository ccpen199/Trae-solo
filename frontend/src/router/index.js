import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import Layout from '@/components/Layout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true, pageName: 'dashboard' }
      },
      {
        path: 'flights',
        name: 'Flights',
        component: () => import('@/views/Flights.vue'),
        meta: { requiresAuth: true, pageName: 'flights' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { requiresAuth: true, pageName: 'orders' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { requiresAuth: true, pageName: 'orders' }
      },
      {
        path: 'my-orders',
        name: 'MyOrders',
        component: () => import('@/views/MyOrders.vue'),
        meta: { requiresAuth: true, pageName: 'my_orders' }
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: () => import('@/views/Tickets.vue'),
        meta: { requiresAuth: true, pageName: 'tickets' }
      },
      {
        path: 'rebook-refund',
        name: 'RebookRefund',
        component: () => import('@/views/RebookRefund.vue'),
        meta: { requiresAuth: true, pageName: 'rebook_refund' }
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
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
    return
  }
  
  if (to.meta.requiresAuth && to.meta.pageName) {
    if (!userStore.permissions) {
      try {
        await userStore.fetchPermissions()
        await userStore.fetchTodoCount()
      } catch (error) {
        console.error('获取权限失败:', error)
      }
    }
    
    if (!userStore.canAccessPage(to.meta.pageName)) {
      next('/dashboard')
      return
    }
  }
  
  next()
})

export default router
