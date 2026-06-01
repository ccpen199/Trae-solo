import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Customers from './views/Customers.vue'
import Products from './views/Products.vue'
import Inbound from './views/Inbound.vue'
import Inventory from './views/Inventory.vue'
import Temperature from './views/Temperature.vue'
import Outbound from './views/Outbound.vue'
import Billing from './views/Billing.vue'
import Exceptions from './views/Exceptions.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard, name: '仪表盘' },
  { path: '/customers', component: Customers, name: '客户管理' },
  { path: '/products', component: Products, name: '货品管理' },
  { path: '/inbound', component: Inbound, name: '入库管理' },
  { path: '/inventory', component: Inventory, name: '库存管理' },
  { path: '/temperature', component: Temperature, name: '温度监控' },
  { path: '/outbound', component: Outbound, name: '出库管理' },
  { path: '/billing', component: Billing, name: '费用结算' },
  { path: '/exceptions', component: Exceptions, name: '异常处理' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
