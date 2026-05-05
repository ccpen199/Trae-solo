import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页仪表盘', icon: 'DataAnalysis' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
        meta: { title: '订单管理', icon: 'Document' }
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/orders/OrderForm.vue'),
        meta: { title: '创建订单', hidden: true }
      },
      {
        path: 'orders/:id/edit',
        name: 'OrderEdit',
        component: () => import('@/views/orders/OrderForm.vue'),
        meta: { title: '编辑订单', hidden: true }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetail.vue'),
        meta: { title: '订单详情', hidden: true }
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: () => import('@/views/vehicles/VehicleList.vue'),
        meta: { title: '车辆管理', icon: 'Van' }
      },
      {
        path: 'vehicles/monitor',
        name: 'VehicleMonitor',
        component: () => import('@/views/vehicles/VehicleMonitor.vue'),
        meta: { title: '车辆监控', icon: 'Monitor' }
      },
      {
        path: 'drivers',
        name: 'Drivers',
        component: () => import('@/views/drivers/DriverList.vue'),
        meta: { title: '司机管理', icon: 'User' }
      },
      {
        path: 'dispatch',
        name: 'Dispatch',
        component: () => import('@/views/dispatch/DispatchList.vue'),
        meta: { title: '调度指令', icon: 'ChatDotRound' }
      },
      {
        path: 'settlements',
        name: 'Settlements',
        component: () => import('@/views/settlements/SettlementList.vue'),
        meta: { title: '费用结算', icon: 'Money' }
      },
      {
        path: 'track',
        name: 'TrackQuery',
        component: () => import('@/views/track/TrackQuery.vue'),
        meta: { title: '轨迹查询', icon: 'Guide' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心', hidden: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 物流运输调度管理系统` : '物流运输调度管理系统'
  
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth === false) {
    if (userStore.isLoggedIn && to.path === '/login') {
      next('/dashboard')
      return
    }
    next()
    return
  }
  
  if (!userStore.isLoggedIn) {
    next(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    return
  }
  
  next()
})

export default router
