import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'invoices',
        name: 'Invoices',
        component: () => import('@/views/InvoiceList.vue'),
        meta: { title: '发票管理' }
      },
      {
        path: 'invoices/new',
        name: 'NewInvoice',
        component: () => import('@/views/NewInvoice.vue'),
        meta: { title: '新建开票申请', requiresCustomer: true }
      },
      {
        path: 'invoices/:id',
        name: 'InvoiceDetail',
        component: () => import('@/views/InvoiceDetail.vue'),
        meta: { title: '发票详情' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/OrderList.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/AuditLog.vue'),
        meta: { title: '审计日志', requiresInternal: true }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { title: '财税报表', requiresFinance: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 发票管理系统` : '发票管理系统'

  const token = localStorage.getItem('token')
  const userInfo = localStorage.getItem('userInfo')
  const isLoggedIn = !!token && !!userInfo

  let userRole = ''
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo)
      userRole = parsed.role || ''
    } catch (e) {
      userRole = ''
    }
  }

  const isCustomer = userRole === 'customer'
  const isFinance = userRole === 'finance'
  const isTax = userRole === 'tax'
  const isSales = userRole === 'sales'
  const isInternal = isFinance || isTax || isSales

  if (to.path === '/login') {
    if (isLoggedIn) {
      next('/dashboard')
    } else {
      next()
    }
    return
  }

  if (!isLoggedIn) {
    next('/login')
    return
  }

  if (to.meta.requiresCustomer && !isCustomer) {
    next('/dashboard')
    return
  }

  if (to.meta.requiresInternal && !isInternal) {
    next('/dashboard')
    return
  }

  if (to.meta.requiresFinance && !isFinance && !isTax) {
    next('/dashboard')
    return
  }

  next()
})

export default router
