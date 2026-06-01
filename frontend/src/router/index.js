import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import CustomerList from '../views/CustomerList.vue'
import CustomerDetail from '../views/CustomerDetail.vue'
import PropertyList from '../views/PropertyList.vue'
import Reports from '../views/Reports.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/customers', name: 'CustomerList', component: CustomerList },
  { path: '/customers/:id', name: 'CustomerDetail', component: CustomerDetail },
  { path: '/properties', name: 'PropertyList', component: PropertyList },
  { path: '/reports', name: 'Reports', component: Reports }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
