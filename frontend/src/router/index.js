import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/customer',
    component: () => import('@/layouts/CustomerLayout.vue'),
    meta: { requiresAuth: true, roles: ['customer'] },
    children: [
      {
        path: '',
        name: 'CustomerHome',
        redirect: '/customer/orders'
      },
      {
        path: 'payment',
        name: 'CustomerPayment',
        component: () => import('@/views/customer/Payment.vue')
      },
      {
        path: 'orders',
        name: 'CustomerOrders',
        component: () => import('@/views/customer/Orders.vue')
      },
      {
        path: 'orders/:orderNo',
        name: 'CustomerOrderDetail',
        component: () => import('@/views/customer/OrderDetail.vue')
      }
    ]
  },
  {
    path: '/merchant',
    component: () => import('@/layouts/MerchantLayout.vue'),
    meta: { requiresAuth: true, roles: ['merchant_admin', 'merchant_operator'] },
    children: [
      {
        path: '',
        name: 'MerchantHome',
        redirect: '/merchant/dashboard'
      },
      {
        path: 'dashboard',
        name: 'MerchantDashboard',
        component: () => import('@/views/merchant/Dashboard.vue')
      },
      {
        path: 'orders',
        name: 'MerchantOrders',
        component: () => import('@/views/merchant/Orders.vue')
      },
      {
        path: 'orders/:orderNo',
        name: 'MerchantOrderDetail',
        component: () => import('@/views/merchant/OrderDetail.vue')
      },
      {
        path: 'balance',
        name: 'MerchantBalance',
        component: () => import('@/views/merchant/Balance.vue')
      },
      {
        path: 'payouts',
        name: 'MerchantPayouts',
        component: () => import('@/views/merchant/Payouts.vue')
      },
      {
        path: 'profit-sharings',
        name: 'MerchantProfitSharings',
        component: () => import('@/views/merchant/ProfitSharings.vue')
      }
    ]
  },
  {
    path: '/finance',
    component: () => import('@/layouts/FinanceLayout.vue'),
    meta: { requiresAuth: true, roles: ['finance', 'admin'] },
    children: [
      {
        path: '',
        name: 'FinanceHome',
        redirect: '/finance/reconciliation'
      },
      {
        path: 'reconciliation',
        name: 'FinanceReconciliation',
        component: () => import('@/views/finance/Reconciliation.vue')
      },
      {
        path: 'reconciliation/:reconciliationNo',
        name: 'FinanceReconciliationDetail',
        component: () => import('@/views/finance/ReconciliationDetail.vue')
      },
      {
        path: 'adjustment-pool',
        name: 'FinanceAdjustmentPool',
        component: () => import('@/views/finance/AdjustmentPool.vue')
      },
      {
        path: 'bills',
        name: 'FinanceBills',
        component: () => import('@/views/finance/Bills.vue')
      }
    ]
  },
  {
    path: '/audit',
    component: () => import('@/layouts/AuditLayout.vue'),
    meta: { requiresAuth: true, roles: ['finance', 'admin'] },
    children: [
      {
        path: '',
        name: 'AuditHome',
        redirect: '/audit/logs'
      },
      {
        path: 'logs',
        name: 'AuditLogs',
        component: () => import('@/views/audit/Logs.vue')
      },
      {
        path: 'logs/:auditNo',
        name: 'AuditLogDetail',
        component: () => import('@/views/audit/LogDetail.vue')
      },
      {
        path: 'order-trace',
        name: 'AuditOrderTrace',
        component: () => import('@/views/audit/OrderTrace.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.guest && userStore.isLoggedIn) {
    const role = userStore.userRole
    if (role === 'customer') {
      next({ name: 'CustomerHome' })
    } else if (role === 'merchant_admin' || role === 'merchant_operator') {
      next({ name: 'MerchantHome' })
    } else if (role === 'finance' || role === 'admin') {
      next({ name: 'FinanceHome' })
    } else {
      next({ name: 'CustomerHome' })
    }
    return
  }
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.roles && to.meta.roles.length > 0) {
    const userRole = userStore.userRole
    if (!to.meta.roles.includes(userRole)) {
      next({ name: 'Login' })
      return
    }
  }
  
  next()
})

export default router
