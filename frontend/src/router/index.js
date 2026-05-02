import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

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
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'houses',
        name: 'Houses',
        component: () => import('@/views/Houses.vue'),
        meta: { title: '房源列表' }
      },
      {
        path: 'houses/:id',
        name: 'HouseDetail',
        component: () => import('@/views/HouseDetail.vue'),
        meta: { title: '房源详情' }
      },
      {
        path: 'sessions',
        name: 'Sessions',
        component: () => import('@/views/Sessions.vue'),
        meta: { title: '看房会话' }
      },
      {
        path: 'sessions/:id',
        name: 'SessionDetail',
        component: () => import('@/views/SessionDetail.vue'),
        meta: { title: '会话详情' }
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/Messages.vue'),
        meta: { title: '消息中心' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
    return
  }

  if (token && !userStore.user) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      localStorage.removeItem('token')
      next('/login')
      return
    }
  }

  document.title = to.meta.title ? `${to.meta.title} - 房屋3D看房系统` : '房屋3D看房系统'
  next()
})

export default router
