import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/entries'
  },
  {
    path: '/entries',
    name: 'Entries',
    component: () => import('@/views/Entries.vue')
  },
  {
    path: '/entries/:id',
    name: 'EntryDetail',
    component: () => import('@/views/EntryDetail.vue')
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue')
  },
  {
    path: '/conflicts',
    name: 'Conflicts',
    component: () => import('@/views/Conflicts.vue')
  },
  {
    path: '/shares',
    name: 'Shares',
    component: () => import('@/views/Shares.vue')
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/views/Stats.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
