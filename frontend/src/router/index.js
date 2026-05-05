import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    redirect: '/rider'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/rider',
    name: 'RiderHome',
    component: () => import('../views/rider/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rider/orders',
    name: 'RiderOrders',
    component: () => import('../views/rider/Orders.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rider/orders/:id',
    name: 'OrderDetail',
    component: () => import('../views/rider/OrderDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rider/settings',
    name: 'RiderSettings',
    component: () => import('../views/rider/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rider/schedule',
    name: 'RiderSchedule',
    component: () => import('../views/rider/Schedule.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/rider/profile',
    name: 'RiderProfile',
    component: () => import('../views/rider/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn && userStore.token) {
    try {
      await userStore.fetchProfile()
    } catch (e) {
      // 忽略错误
    }
  }
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next('/rider')
  } else {
    next()
  }
})

export default router
