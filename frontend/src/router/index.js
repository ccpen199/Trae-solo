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
    meta: { title: '仪表盘' }
  },
  {
    path: '/vouchers',
    name: 'Vouchers',
    component: () => import('../views/VoucherList.vue'),
    meta: { title: '凭证管理' }
  },
  {
    path: '/vouchers/create',
    name: 'VoucherCreate',
    component: () => import('../views/VoucherForm.vue'),
    meta: { title: '新建凭证' }
  },
  {
    path: '/vouchers/:id',
    name: 'VoucherDetail',
    component: () => import('../views/VoucherDetail.vue'),
    meta: { title: '凭证详情' }
  },
  {
    path: '/ledgers',
    name: 'Ledgers',
    component: () => import('../views/Ledger.vue'),
    meta: { title: '账簿管理' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/Reports.vue'),
    meta: { title: '报表管理' }
  },
  {
    path: '/closure',
    name: 'Closure',
    component: () => import('../views/Closure.vue'),
    meta: { title: '月末结账' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 会计记账系统` : '会计记账系统'
  next()
})

export default router
