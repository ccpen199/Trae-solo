import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/fleets',
    name: 'Fleets',
    component: () => import('@/views/Fleets.vue')
  },
  {
    path: '/crew',
    name: 'Crew',
    component: () => import('@/views/Crew.vue')
  },
  {
    path: '/crew/:id',
    name: 'CrewDetail',
    component: () => import('@/views/CrewDetail.vue')
  },
  {
    path: '/trains',
    name: 'Trains',
    component: () => import('@/views/Trains.vue')
  },
  {
    path: '/scheduling',
    name: 'Scheduling',
    component: () => import('@/views/Scheduling.vue')
  },
  {
    path: '/shift-changes',
    name: 'ShiftChanges',
    component: () => import('@/views/ShiftChanges.vue')
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
