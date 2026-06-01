import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/devices',
    name: 'Devices',
    component: () => import('../views/Devices.vue')
  },
  {
    path: '/operation-records',
    name: 'OperationRecords',
    component: () => import('../views/OperationRecords.vue')
  },
  {
    path: '/production-records',
    name: 'ProductionRecords',
    component: () => import('../views/ProductionRecords.vue')
  },
  {
    path: '/oee-report',
    name: 'OEEReport',
    component: () => import('../views/OEEReport.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
