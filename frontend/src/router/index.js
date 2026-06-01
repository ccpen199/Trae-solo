import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Earthquake',
    component: () => import('@/views/Earthquake.vue')
  },
  {
    path: '/disasters',
    name: 'Disasters',
    component: () => import('@/views/Disasters.vue')
  },
  {
    path: '/rescue',
    name: 'Rescue',
    component: () => import('@/views/Rescue.vue')
  },
  {
    path: '/materials',
    name: 'Materials',
    component: () => import('@/views/Materials.vue')
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/Reports.vue')
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('@/views/Logs.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
