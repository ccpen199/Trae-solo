import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/planet/:id',
    name: 'PlanetDetail',
    component: () => import('@/views/PlanetDetail.vue'),
    meta: { title: '星球详情' }
  },
  {
    path: '/topic/:id',
    name: 'TopicDetail',
    component: () => import('@/views/TopicDetail.vue'),
    meta: { title: '主题详情' }
  },
  {
    path: '/create-planet',
    name: 'CreatePlanet',
    component: () => import('@/views/CreatePlanet.vue'),
    meta: { title: '创建星球', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: { title: '搜索' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  document.title = `${to.meta.title || '知识星球'} - 私域知识社区`

  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
    return
  }

  if (userStore.token && !userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }

  next()
})

export default router
