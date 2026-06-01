import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/parcels', name: 'Parcels', component: () => import('../views/Parcels.vue') },
  { path: '/parcels/:id', name: 'ParcelDetail', component: () => import('../views/ParcelDetail.vue') },
  { path: '/demands', name: 'Demands', component: () => import('../views/Demands.vue') },
  { path: '/demands/:id', name: 'DemandDetail', component: () => import('../views/DemandDetail.vue') },
  { path: '/contracts', name: 'Contracts', component: () => import('../views/Contracts.vue') },
  { path: '/contracts/:id', name: 'ContractDetail', component: () => import('../views/ContractDetail.vue') },
  { path: '/performance', name: 'Performance', component: () => import('../views/Performance.vue') },
  { path: '/disputes', name: 'Disputes', component: () => import('../views/Disputes.vue') },
  { path: '/reports', name: 'Reports', component: () => import('../views/Reports.vue') },
  { path: '/users', name: 'Users', component: () => import('../views/Users.vue') },
  { path: '/logs', name: 'Logs', component: () => import('../views/Logs.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
