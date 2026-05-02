import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '运营看板' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: '排班管理' }
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/orders/OrderCreate.vue'),
        meta: { title: '新建排班' }
      },
      {
        path: 'orders/:mainOrderNo',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
        meta: { title: '排班详情' }
      },
      {
        path: 'map',
        name: 'Map',
        component: () => import('@/views/Map.vue'),
        meta: { title: '车辆地图' }
      },
      {
        path: 'alarms',
        name: 'Alarms',
        component: () => import('@/views/Alarms.vue'),
        meta: { title: '告警管理' }
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/Exceptions.vue'),
        meta: { title: '异常队列' }
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
  
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
