import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/member/home'
  },
  {
    path: '/member',
    component: () => import('../views/member/MemberLayout.vue'),
    children: [
      {
        path: 'home',
        name: 'MemberHome',
        component: () => import('../views/member/Home.vue')
      },
      {
        path: 'points',
        name: 'MemberPoints',
        component: () => import('../views/member/Points.vue')
      },
      {
        path: 'balance',
        name: 'MemberBalance',
        component: () => import('../views/member/Balance.vue')
      },
      {
        path: 'coupons',
        name: 'MemberCoupons',
        component: () => import('../views/member/Coupons.vue')
      },
      {
        path: 'records',
        name: 'MemberRecords',
        component: () => import('../views/member/Records.vue')
      }
    ]
  },
  {
    path: '/store',
    component: () => import('../views/store/StoreLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'StoreDashboard',
        component: () => import('../views/store/Dashboard.vue')
      },
      {
        path: 'alerts',
        name: 'StoreAlerts',
        component: () => import('../views/store/Alerts.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'MobileLogin',
    component: () => import('../views/Login.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('mobile_token')
  if (!token && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router