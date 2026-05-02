import { createRouter, createWebHistory } from 'vue-router'
import DemandList from '../views/DemandList.vue'
import DemandDetail from '../views/DemandDetail.vue'
import OrderList from '../views/OrderList.vue'
import OrderDetail from '../views/OrderDetail.vue'
import Dashboard from '../views/Dashboard.vue'
import InstallationList from '../views/InstallationList.vue'
import ProductionList from '../views/ProductionList.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/demands',
    name: 'DemandList',
    component: DemandList
  },
  {
    path: '/demands/:id',
    name: 'DemandDetail',
    component: DemandDetail
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: OrderList
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: OrderDetail
  },
  {
    path: '/production',
    name: 'ProductionList',
    component: ProductionList
  },
  {
    path: '/installations',
    name: 'InstallationList',
    component: InstallationList
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router