import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/cashier'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/cashier',
    name: 'Cashier',
    component: () => import('../views/Cashier.vue')
  },
  {
    path: '/manager',
    name: 'Manager',
    component: () => import('../views/Manager.vue')
  },
  {
    path: '/finance',
    name: 'Finance',
    component: () => import('../views/Finance.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('pos_token')
  if (!token && to.path !== '/login') {
    next('/login')
  } else {
    next()
  }
})

export default router
