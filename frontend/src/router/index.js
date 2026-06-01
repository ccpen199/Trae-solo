import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/hotels',
    name: 'Hotels',
    component: () => import('@/views/Hotels.vue')
  },
  {
    path: '/control-plans',
    name: 'ControlPlans',
    component: () => import('@/views/ControlPlans.vue')
  },
  {
    path: '/teams',
    name: 'Teams',
    component: () => import('@/views/Teams.vue')
  },
  {
    path: '/teams/:id',
    name: 'TeamDetail',
    component: () => import('@/views/TeamDetail.vue')
  },
  {
    path: '/settlements',
    name: 'Settlements',
    component: () => import('@/views/Settlements.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
