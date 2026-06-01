import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/receive',
    name: 'Receive',
    component: () => import('../views/Receive.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pay/:qrId?',
    name: 'Pay',
    component: () => import('../views/Pay.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/scan',
    name: 'Scan',
    component: () => import('../views/Scan.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('../views/Transactions.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bank-cards',
    name: 'BankCards',
    component: () => import('../views/BankCards.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bank-cards/bind',
    name: 'BindBankCard',
    component: () => import('../views/BindBankCard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn) {
    await userStore.initFromStorage()
  }
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
