import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../views/Register.vue') },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      
      { path: 'shipper/cert', name: 'ShipperCert', component: () => import('../views/shipper/Cert.vue') },
      { path: 'shipper/cargo', name: 'CargoList', component: () => import('../views/shipper/CargoList.vue') },
      { path: 'shipper/cargo/publish', name: 'PublishCargo', component: () => import('../views/shipper/PublishCargo.vue') },
      { path: 'shipper/cargo/:id', name: 'CargoDetail', component: () => import('../views/shipper/CargoDetail.vue') },
      { path: 'shipper/whitelist', name: 'Whitelist', component: () => import('../views/shipper/Whitelist.vue') },
      { path: 'shipper/cooperation', name: 'CooperationRecords', component: () => import('../views/shipper/CooperationRecords.vue') },
      
      { path: 'driver/info', name: 'DriverInfo', component: () => import('../views/driver/Info.vue') },
      { path: 'driver/cargo-pool', name: 'CargoPool', component: () => import('../views/driver/CargoPool.vue') },
      { path: 'driver/my-bids', name: 'MyBids', component: () => import('../views/driver/MyBids.vue') },
      
      { path: 'waybill', name: 'WaybillList', component: () => import('../views/waybill/List.vue') },
      { path: 'waybill/:id', name: 'WaybillDetail', component: () => import('../views/waybill/Detail.vue') },
      { path: 'waybill/:id/tracking', name: 'WaybillTracking', component: () => import('../views/waybill/Tracking.vue') },
      
      { path: 'wallet', name: 'Wallet', component: () => import('../views/payment/Wallet.vue') },
      { path: 'transactions', name: 'Transactions', component: () => import('../views/payment/Transactions.vue') },
      { path: 'escrow', name: 'EscrowList', component: () => import('../views/payment/EscrowList.vue') },
      
      { path: 'admin/users', name: 'AdminUsers', component: () => import('../views/admin/Users.vue') },
      { path: 'admin/waybills', name: 'AdminWaybills', component: () => import('../views/admin/Waybills.vue') },
      { path: 'admin/alerts', name: 'AdminAlerts', component: () => import('../views/admin/Alerts.vue') },
      { path: 'admin/reconciliation', name: 'Reconciliation', component: () => import('../views/admin/Reconciliation.vue') },
      { path: 'admin/insurance', name: 'AdminInsurance', component: () => import('../views/admin/Insurance.vue') },
      { path: 'admin/audit-logs', name: 'AuditLogs', component: () => import('../views/admin/AuditLogs.vue') }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
