import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/OrderList.vue'),
        meta: { title: '主单台账' }
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/OrderForm.vue'),
        meta: { title: '新建申报' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { title: '单据详情' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
    return
  }

  if (to.path === '/login' && token) {
    next('/dashboard')
    return
  }

  if (token && !userStore.user) {
    try {
      await userStore.fetchCurrentUser()
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      next('/login')
      return
    }
  }

  document.title = to.meta.title ? `${to.meta.title} - 税务筹划与申报系统` : '税务筹划与申报系统'
  next()
})

export default router
