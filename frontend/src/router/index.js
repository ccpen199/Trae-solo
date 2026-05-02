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
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '运营看板', icon: 'DataLine' }
      },
      {
        path: 'map',
        name: 'MapView',
        component: () => import('@/views/MapView.vue'),
        meta: { title: '地图监控', icon: 'MapLocation' }
      },
      {
        path: 'stations',
        name: 'Stations',
        component: () => import('@/views/Stations.vue'),
        meta: { title: '电站管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'inverters',
        name: 'Inverters',
        component: () => import('@/views/Inverters.vue'),
        meta: { title: '设备监控', icon: 'Cpu' }
      },
      {
        path: 'maintenance',
        name: 'Maintenance',
        component: () => import('@/views/Maintenance.vue'),
        meta: { title: '维修工单', icon: 'Tools' }
      },
      {
        path: 'cleaning',
        name: 'Cleaning',
        component: () => import('@/views/Cleaning.vue'),
        meta: { title: '清洗工单', icon: 'MagicStick' }
      },
      {
        path: 'revenue',
        name: 'Revenue',
        component: () => import('@/views/Revenue.vue'),
        meta: { title: '收益分析', icon: 'Money' }
      },
      {
        path: 'assets',
        name: 'Assets',
        component: () => import('@/views/Assets.vue'),
        meta: { title: '资产估值', icon: 'TrendCharts' }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '消息通知', icon: 'Bell' }
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
  
  document.title = to.meta.title ? `${to.meta.title} - 光伏电站运维系统` : '光伏电站运维系统'
  
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.name === 'Login' && userStore.isLoggedIn) {
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

export default router
