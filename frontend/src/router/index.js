import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/cranes', name: 'Cranes', component: () => import('../views/Cranes.vue') },
  { path: '/monitor', name: 'Monitor', component: () => import('../views/Monitor.vue') },
  { path: '/alerts', name: 'Alerts', component: () => import('../views/Alerts.vue') },
  { path: '/maintenance', name: 'Maintenance', component: () => import('../views/Maintenance.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
