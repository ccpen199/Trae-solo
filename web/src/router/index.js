import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据看板', icon: 'DataLine' }
      },
      {
        path: 'barcode',
        name: 'Barcode',
        component: () => import('@/views/barcode/index.vue'),
        meta: { title: '条码管理', icon: 'QRCode', roles: ['admin', 'manager', 'operator'] }
      },
      {
        path: 'entry-scan',
        name: 'EntryScan',
        component: () => import('@/views/entry-scan/index.vue'),
        meta: { title: '入场扫描', icon: 'Camera', roles: ['admin', 'manager', 'operator'] }
      },
      {
        path: 'catering-scan',
        name: 'CateringScan',
        component: () => import('@/views/catering-scan/index.vue'),
        meta: { title: '餐饮消费', icon: 'Coffee', roles: ['admin', 'manager', 'operator'] }
      },
      {
        path: 'booklet-scan',
        name: 'BookletScan',
        component: () => import('@/views/booklet-scan/index.vue'),
        meta: { title: '图册发放', icon: 'Reading', roles: ['admin', 'manager', 'operator'] }
      },
      {
        path: 'device',
        name: 'Device',
        component: () => import('@/views/device/index.vue'),
        meta: { title: '手持机管理', icon: 'Monitor', roles: ['admin', 'manager'] }
      },
      {
        path: 'department',
        name: 'Department',
        component: () => import('@/views/department/index.vue'),
        meta: { title: '部门管理', icon: 'OfficeBuilding', roles: ['admin', 'manager'] }
      },
      {
        path: 'time-slot',
        name: 'TimeSlot',
        component: () => import('@/views/time-slot/index.vue'),
        meta: { title: '时段设置', icon: 'Clock', roles: ['admin', 'manager'] }
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'User', roles: ['admin', 'manager'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/index.vue'),
        meta: { title: '统计报表', icon: 'TrendCharts', roles: ['admin', 'manager'] },
        children: [
          {
            path: 'entry',
            name: 'EntryReport',
            component: () => import('@/views/reports/entry.vue'),
            meta: { title: '入场统计' }
          },
          {
            path: 'catering',
            name: 'CateringReport',
            component: () => import('@/views/reports/catering.vue'),
            meta: { title: '餐饮统计' }
          },
          {
            path: 'booklet',
            name: 'BookletReport',
            component: () => import('@/views/reports/booklet.vue'),
            meta: { title: '图册统计' }
          },
          {
            path: 'department',
            name: 'DepartmentReport',
            component: () => import('@/views/reports/department.vue'),
            meta: { title: '部门统计' }
          }
        ]
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
  const token = localStorage.getItem('token')
  
  document.title = to.meta.title ? `${to.meta.title} - 会展管理系统` : '会展管理系统'
  
  if (to.meta.requiresAuth === false) {
    next()
    return
  }
  
  if (!token) {
    next('/login')
    return
  }
  
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      localStorage.removeItem('token')
      next('/login')
      return
    }
  }
  
  if (to.meta.roles && to.meta.roles.length > 0) {
    const hasPermission = to.meta.roles.includes(userStore.userInfo?.role)
    if (!hasPermission) {
      next('/dashboard')
      return
    }
  }
  
  next()
})

export default router
