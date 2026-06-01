import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('@/views/Applications.vue')
  },
  {
    path: '/applications/:id',
    name: 'ApplicationDetail',
    component: () => import('@/views/ApplicationDetail.vue')
  },
  {
    path: '/configs',
    name: 'Configs',
    component: () => import('@/views/Configs.vue')
  },
  {
    path: '/configs/:id',
    name: 'ConfigDetail',
    component: () => import('@/views/ConfigDetail.vue')
  },
  {
    path: '/executions',
    name: 'Executions',
    component: () => import('@/views/Executions.vue')
  },
  {
    path: '/executions/tasks/:id',
    name: 'TaskDetail',
    component: () => import('@/views/TaskDetail.vue')
  },
  {
    path: '/console',
    name: 'Console',
    component: () => import('@/views/Console.vue')
  },
  {
    path: '/changes',
    name: 'Changes',
    component: () => import('@/views/Changes.vue')
  },
  {
    path: '/exceptions',
    name: 'Exceptions',
    component: () => import('@/views/Exceptions.vue')
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('@/views/Alerts.vue')
  },
  {
    path: '/audit',
    name: 'Audit',
    component: () => import('@/views/Audit.vue')
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/Reports.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
