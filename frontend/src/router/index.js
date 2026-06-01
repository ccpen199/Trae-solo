import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/buildings',
    component: () => import('@/views/Buildings.vue')
  },
  {
    path: '/rooms',
    component: () => import('@/views/Rooms.vue')
  },
  {
    path: '/leads',
    component: () => import('@/views/Leads.vue')
  },
  {
    path: '/leads/:id',
    component: () => import('@/views/LeadDetail.vue')
  },
  {
    path: '/viewings',
    component: () => import('@/views/Viewings.vue')
  },
  {
    path: '/quotes',
    component: () => import('@/views/Quotes.vue')
  },
  {
    path: '/contracts',
    component: () => import('@/views/Contracts.vue')
  },
  {
    path: '/reports',
    component: () => import('@/views/Reports.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
