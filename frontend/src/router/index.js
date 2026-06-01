import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Vehicles from '../views/Vehicles.vue'
import Valuations from '../views/Valuations.vue'
import Loans from '../views/Loans.vue'
import Mortgages from '../views/Mortgages.vue'
import GpsMonitor from '../views/GpsMonitor.vue'
import RiskAlerts from '../views/RiskAlerts.vue'
import Disposals from '../views/Disposals.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/vehicles', name: 'Vehicles', component: Vehicles },
  { path: '/valuations', name: 'Valuations', component: Valuations },
  { path: '/loans', name: 'Loans', component: Loans },
  { path: '/mortgages', name: 'Mortgages', component: Mortgages },
  { path: '/gps', name: 'GpsMonitor', component: GpsMonitor },
  { path: '/risks', name: 'RiskAlerts', component: RiskAlerts },
  { path: '/disposals', name: 'Disposals', component: Disposals }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
