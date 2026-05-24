import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('../views/Home.vue') },
  { path: '/login', component: () => import('../views/Login.vue') },
  { path: '/register', component: () => import('../views/Register.vue') },
  
  { path: '/member', component: () => import('../views/member/Layout.vue'),
    children: [
      { path: '', redirect: '/member/dashboard' },
      { path: 'dashboard', component: () => import('../views/member/Dashboard.vue') },
      { path: 'vehicles', component: () => import('../views/member/Vehicles.vue') },
      { path: 'coupons', component: () => import('../views/member/Coupons.vue') },
      { path: 'transactions', component: () => import('../views/member/Transactions.vue') },
      { path: 'recharge', component: () => import('../views/member/Recharge.vue') },
      { path: 'invoices', component: () => import('../views/member/Invoices.vue') },
      { path: 'complaints', component: () => import('../views/member/Complaints.vue') }
    ]
  },
  
  { path: '/cashier', component: () => import('../views/cashier/Layout.vue'),
    children: [
      { path: '', redirect: '/cashier/fuel' },
      { path: 'fuel', component: () => import('../views/cashier/Fuel.vue') },
      { path: 'transactions', component: () => import('../views/cashier/Transactions.vue') },
      { path: 'shift', component: () => import('../views/cashier/Shift.vue') }
    ]
  },
  
  { path: '/manager', component: () => import('../views/manager/Layout.vue'),
    children: [
      { path: '', redirect: '/manager/dashboard' },
      { path: 'dashboard', component: () => import('../views/manager/Dashboard.vue') },
      { path: 'prices', component: () => import('../views/manager/Prices.vue') },
      { path: 'inventory', component: () => import('../views/manager/Inventory.vue') },
      { path: 'transactions', component: () => import('../views/manager/Transactions.vue') },
      { path: 'shifts', component: () => import('../views/manager/Shifts.vue') }
    ]
  },
  
  { path: '/hq', component: () => import('../views/hq/Layout.vue'),
    children: [
      { path: '', redirect: '/hq/dashboard' },
      { path: 'dashboard', component: () => import('../views/hq/Dashboard.vue') },
      { path: 'members', component: () => import('../views/hq/Members.vue') },
      { path: 'transactions', component: () => import('../views/hq/Transactions.vue') },
      { path: 'invoices', component: () => import('../views/hq/Invoices.vue') },
      { path: 'complaints', component: () => import('../views/hq/Complaints.vue') },
      { path: 'reports', component: () => import('../views/hq/Reports.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userType = localStorage.getItem('userType')
  
  if (to.path.startsWith('/member') && (!token || userType !== 'member')) {
    return next('/login?type=member')
  }
  if (to.path.startsWith('/cashier') && (!token || userType !== 'staff')) {
    return next('/login?type=staff')
  }
  if (to.path.startsWith('/manager') && (!token || userType !== 'staff')) {
    return next('/login?type=staff')
  }
  if (to.path.startsWith('/hq') && (!token || userType !== 'staff')) {
    return next('/login?type=staff')
  }
  next()
})

export default router
