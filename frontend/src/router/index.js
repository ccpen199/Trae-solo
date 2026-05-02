import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '控制台' }
  },
  {
    path: '/rules',
    redirect: '/rules/list'
  },
  {
    path: '/rules/list',
    name: 'RuleList',
    component: () => import('../views/rules/RuleList.vue'),
    meta: { title: '规则列表' }
  },
  {
    path: '/rules/builder',
    name: 'RuleBuilder',
    component: () => import('../views/rules/RuleBuilder.vue'),
    meta: { title: '规则配置器' }
  },
  {
    path: '/variables',
    redirect: '/variables/list'
  },
  {
    path: '/variables/list',
    name: 'VariableList',
    component: () => import('../views/variables/VariableList.vue'),
    meta: { title: '变量列表' }
  },
  {
    path: '/decision',
    name: 'Decision',
    component: () => import('../views/Decision.vue'),
    meta: { title: '决策中心' }
  },
  {
    path: '/review',
    name: 'Review',
    component: () => import('../views/Review.vue'),
    meta: { title: '审核池' }
  },
  {
    path: '/backtest',
    name: 'Backtest',
    component: () => import('../views/Backtest.vue'),
    meta: { title: '回测分析' }
  },
  {
    path: '/audit',
    name: 'Audit',
    component: () => import('../views/Audit.vue'),
    meta: { title: '审计日志' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
