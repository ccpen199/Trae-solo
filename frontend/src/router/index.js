import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/employees',
    name: 'Employees',
    component: () => import('../views/Employees.vue')
  },
  {
    path: '/employees/:id',
    name: 'EmployeeDetail',
    component: () => import('../views/EmployeeDetail.vue')
  },
  {
    path: '/positions',
    name: 'Positions',
    component: () => import('../views/Positions.vue')
  },
  {
    path: '/training',
    name: 'Training',
    component: () => import('../views/Training.vue')
  },
  {
    path: '/authorizations',
    name: 'Authorizations',
    component: () => import('../views/Authorizations.vue')
  },
  {
    path: '/approval',
    name: 'Approval',
    component: () => import('../views/Approval.vue')
  },
  {
    path: '/schedules',
    name: 'Schedules',
    component: () => import('../views/Schedules.vue')
  },
  {
    path: '/audit',
    name: 'Audit',
    component: () => import('../views/Audit.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
