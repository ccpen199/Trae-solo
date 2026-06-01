import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/issues',
    name: 'Issues',
    component: () => import('../views/Issues.vue')
  },
  {
    path: '/issues/:id',
    name: 'IssueDetail',
    component: () => import('../views/IssueDetail.vue')
  },
  {
    path: '/model',
    name: 'Model',
    component: () => import('../views/ModelView.vue')
  },
  {
    path: '/organizations',
    name: 'Organizations',
    component: () => import('../views/Organizations.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
