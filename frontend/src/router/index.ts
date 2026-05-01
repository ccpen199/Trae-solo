import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/login/Register.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/layout/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('@/views/dashboard/Dashboard.vue'),
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrderList.vue'),
      },
      {
        path: 'commissions',
        name: 'Commissions',
        component: () => import('@/views/commissions/CommissionList.vue'),
      },
      {
        path: 'withdraws',
        name: 'Withdraws',
        component: () => import('@/views/withdraws/WithdrawList.vue'),
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/materials/MaterialList.vue'),
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/finance/FinanceDashboard.vue'),
      },
      {
        path: 'operator',
        name: 'Operator',
        component: () => import('@/views/operator/OperatorDashboard.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/Profile.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const isLoggedIn = !!token

  if (to.path === '/login' || to.path === '/register') {
    if (isLoggedIn) {
      next('/dashboard/home')
      return
    }
    next()
    return
  }

  if (to.path.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      next('/login')
      return
    }
  }

  next()
})

export default router
