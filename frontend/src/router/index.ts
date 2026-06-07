import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/user/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/user/Home.vue'),
    meta: { requiresAuth: true, title: '首页' }
  },
  {
    path: '/device/:id',
    name: 'DeviceDetail',
    component: () => import('@/views/user/DeviceDetail.vue'),
    meta: { requiresAuth: true, title: '设备详情' }
  },
  {
    path: '/wash/:id',
    name: 'WashControl',
    component: () => import('@/views/user/WashControl.vue'),
    meta: { requiresAuth: true, title: '洗衣控制' }
  },
  {
    path: '/payment/:orderId',
    name: 'Payment',
    component: () => import('@/views/user/Payment.vue'),
    meta: { requiresAuth: true, title: '支付' }
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('@/views/user/OrderList.vue'),
    meta: { requiresAuth: true, title: '我的订单' }
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('@/views/user/OrderDetail.vue'),
    meta: { requiresAuth: true, title: '订单详情' }
  },
  {
    path: '/admin',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: 'map',
        name: 'GisMap',
        component: () => import('@/views/admin/GisMap.vue'),
        meta: { title: 'GIS热力图' }
      },
      {
        path: 'devices',
        name: 'DeviceList',
        component: () => import('@/views/admin/DeviceList.vue'),
        meta: { title: '设备管理' }
      },
      {
        path: 'workorders',
        name: 'WorkOrders',
        component: () => import('@/views/admin/WorkOrders.vue'),
        meta: { title: '工单管理' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/admin/Reports.vue'),
        meta: { title: '报表管理' }
      },
      {
        path: 'alerts',
        name: 'Alerts',
        component: () => import('@/views/admin/Alerts.vue'),
        meta: { title: '告警管理' }
      },
      {
        path: 'firmware',
        name: 'Firmware',
        component: () => import('@/views/admin/Firmware.vue'),
        meta: { title: '固件升级' }
      },
      {
        path: 'brand',
        name: 'BrandConfig',
        component: () => import('@/views/admin/BrandConfig.vue'),
        meta: { title: '品牌配置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const ADMIN_ROLES = ['admin', 'platform', 'ops', 'property', 'manufacturer']

function getRoleHome(role: string): string {
  if (ADMIN_ROLES.includes(role as any)) {
    return '/admin/dashboard'
  }
  return '/home'
}

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  document.title = (to.meta.title as string) || '智能洗衣管理系统'
  
  console.log('[Router Guard] Navigating to:', to.path, 'from:', _from.path)
  console.log('[Router Guard] token:', !!userStore.token, 'userInfo:', userStore.userInfo, 'role:', userStore.userInfo?.role)
  
  if (to.path === '/login' && userStore.token) {
    const role = userStore.userInfo?.role || 'user'
    const homePath = getRoleHome(role)
    console.log('[Router Guard] Already logged in, redirect to:', homePath)
    next(homePath)
    return
  }
  
  if (to.path === '/' && userStore.token) {
    const role = userStore.userInfo?.role || 'user'
    const homePath = getRoleHome(role)
    console.log('[Router Guard] Root path, redirect to:', homePath)
    next(homePath)
    return
  }
  
  if (to.path === '/' && !userStore.token) {
    console.log('[Router Guard] Root path, not logged in, redirect to login')
    next('/login')
    return
  }
  
  if (to.meta.requiresAuth && !userStore.token) {
    console.log('[Router Guard] No token, redirect to login')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (userStore.token && !userStore.userInfo && to.path !== '/login') {
    console.log('[Router Guard] Have token but no userInfo, fetching...')
    try {
      await userStore.fetchUserInfo()
      console.log('[Router Guard] userInfo fetched:', userStore.userInfo)
    } catch (e) {
      console.error('[Router Guard] Failed to fetch userInfo, logout:', e)
      userStore.logout()
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  if (to.meta.requiresAdmin) {
    const role = userStore.userInfo?.role || ''
    const isAdmin = ADMIN_ROLES.includes(role as any)
    console.log('[Router Guard] Admin check - role:', role, 'isAdmin:', isAdmin)
    if (!isAdmin) {
      console.log('[Router Guard] Not admin, redirect to /home')
      next('/home')
      return
    }
  }
  
  console.log('[Router Guard] Proceed to:', to.path)
  next()
})

export default router
