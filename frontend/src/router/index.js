import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../pages/Dashboard.vue')
  },
  {
    path: '/workbench',
    name: 'Workbench',
    component: () => import('../pages/Workbench.vue')
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('../pages/Applications.vue')
  },
  {
    path: '/applications/:id',
    name: 'ApplicationDetail',
    component: () => import('../pages/ApplicationDetail.vue')
  },
  {
    path: '/change-orders',
    name: 'ChangeOrders',
    component: () => import('../pages/ChangeOrders.vue')
  },
  {
    path: '/change-orders/:id',
    name: 'ChangeOrderDetail',
    component: () => import('../pages/ChangeOrderDetail.vue')
  },
  {
    path: '/tasks',
    name: 'ExecutionTasks',
    component: () => import('../pages/ExecutionTasks.vue')
  },
  {
    path: '/secrets',
    name: 'Secrets',
    component: () => import('../pages/Secrets.vue')
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('../pages/Alerts.vue')
  },
  {
    path: '/audit',
    name: 'AuditLogs',
    component: () => import('../pages/AuditLogs.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
