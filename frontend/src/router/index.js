import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../components/Layout.vue'
import Dashboard from '../views/Dashboard.vue'
import Projects from '../views/Projects.vue'
import Budget from '../views/Budget.vue'
import Reimbursements from '../views/Reimbursements.vue'
import Purchases from '../views/Purchases.vue'
import Contracts from '../views/Contracts.vue'
import FundReceipts from '../views/FundReceipts.vue'
import Completions from '../views/Completions.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: Dashboard },
      { path: 'projects', name: 'Projects', component: Projects },
      { path: 'budget', name: 'Budget', component: Budget },
      { path: 'reimbursements', name: 'Reimbursements', component: Reimbursements },
      { path: 'purchases', name: 'Purchases', component: Purchases },
      { path: 'contracts', name: 'Contracts', component: Contracts },
      { path: 'fund-receipts', name: 'FundReceipts', component: FundReceipts },
      { path: 'completions', name: 'Completions', component: Completions }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
