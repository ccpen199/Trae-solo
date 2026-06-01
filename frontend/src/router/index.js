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
    path: '/units',
    name: 'Units',
    component: () => import('../views/Units.vue')
  },
  {
    path: '/inspections',
    name: 'Inspections',
    component: () => import('../views/Inspections.vue')
  },
  {
    path: '/inspections/new',
    name: 'NewInspection',
    component: () => import('../views/NewInspection.vue')
  },
  {
    path: '/hazards',
    name: 'Hazards',
    component: () => import('../views/Hazards.vue')
  },
  {
    path: '/rectifications',
    name: 'Rectifications',
    component: () => import('../views/Rectifications.vue')
  },
  {
    path: '/rechecks',
    name: 'Rechecks',
    component: () => import('../views/Rechecks.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
