import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import Vehicles from '../views/Vehicles.vue'
import VehicleDetail from '../views/VehicleDetail.vue'
import DataCollection from '../views/DataCollection.vue'
import SessionDetail from '../views/SessionDetail.vue'
import Faults from '../views/Faults.vue'
import FaultDetail from '../views/FaultDetail.vue'
import Calibration from '../views/Calibration.vue'
import CalibrationDetail from '../views/CalibrationDetail.vue'
import Reports from '../views/Reports.vue'
import Audit from '../views/Audit.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录' },
  },
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘', requiresAuth: true },
      },
      {
        path: 'vehicles',
        name: 'Vehicles',
        component: Vehicles,
        meta: { title: '车辆档案', requiresAuth: true },
      },
      {
        path: 'vehicles/:id',
        name: 'VehicleDetail',
        component: VehicleDetail,
        meta: { title: '车辆详情', requiresAuth: true },
      },
      {
        path: 'data-collection',
        name: 'DataCollection',
        component: DataCollection,
        meta: { title: '数据采集', requiresAuth: true },
      },
      {
        path: 'data-collection/session/:id',
        name: 'SessionDetail',
        component: SessionDetail,
        meta: { title: '采集详情', requiresAuth: true },
      },
      {
        path: 'faults',
        name: 'Faults',
        component: Faults,
        meta: { title: '故障诊断', requiresAuth: true },
      },
      {
        path: 'faults/:id',
        name: 'FaultDetail',
        component: FaultDetail,
        meta: { title: '故障详情', requiresAuth: true },
      },
      {
        path: 'calibration',
        name: 'Calibration',
        component: Calibration,
        meta: { title: '标定管理', requiresAuth: true },
      },
      {
        path: 'calibration/version/:id',
        name: 'CalibrationDetail',
        component: CalibrationDetail,
        meta: { title: '标定版本详情', requiresAuth: true },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: Reports,
        meta: { title: '报表分析', requiresAuth: true },
      },
      {
        path: 'audit',
        name: 'Audit',
        component: Audit,
        meta: { title: '审计日志', requiresAuth: true, requiresAdmin: true },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - ECU诊断平台` : 'ECU诊断与标定管理平台'
  
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth
  const requiresAdmin = to.meta.requiresAdmin

  if (requiresAuth && !authStore.isLoggedIn) {
    next('/login')
    return
  }

  if (requiresAdmin && !authStore.isAdmin) {
    next('/dashboard')
    return
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
    return
  }

  next()
})

export default router
