import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: false, title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false, title: '注册' }
  },
  {
    path: '/project/:id',
    name: 'ProjectDetail',
    component: () => import('@/views/ProjectDetail.vue'),
    meta: { requiresAuth: false, title: '项目详情' }
  },
  {
    path: '/invest/:id',
    name: 'Invest',
    component: () => import('@/views/Invest.vue'),
    meta: { requiresAuth: true, title: '投资确认' }
  },
  {
    path: '/mine',
    name: 'Mine',
    component: () => import('@/views/Mine.vue'),
    meta: { requiresAuth: true, title: '我的' }
  },
  {
    path: '/recharge',
    name: 'Recharge',
    component: () => import('@/views/Recharge.vue'),
    meta: { requiresAuth: true, title: '充值' }
  },
  {
    path: '/withdraw',
    name: 'Withdraw',
    component: () => import('@/views/Withdraw.vue'),
    meta: { requiresAuth: true, title: '提现' }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('@/views/Transactions.vue'),
    meta: { requiresAuth: true, title: '交易记录' }
  },
  {
    path: '/investments',
    name: 'Investments',
    component: () => import('@/views/Investments.vue'),
    meta: { requiresAuth: true, title: '我的投资' }
  },
  {
    path: '/repayment-plans',
    name: 'RepaymentPlans',
    component: () => import('@/views/RepaymentPlans.vue'),
    meta: { requiresAuth: true, title: '回款计划' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  document.title = `${to.meta.title || '积木盒子'} - P2P理财平台`

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
