import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
    name: 'Launch',
    component: () => import('@/views/Launch.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/views/Welcome.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/guide',
    name: 'Guide',
    component: () => import('@/views/Guide.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/ad-detail',
    name: 'AdDetail',
    component: () => import('@/views/AdDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: false, showTabbar: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: { requiresAuth: false, showTabbar: true }
  },
  {
    path: '/search-result',
    name: 'SearchResult',
    component: () => import('@/views/SearchResult.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/furniture/:id',
    name: 'FurnitureDetail',
    component: () => import('@/views/FurnitureDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/furniture-model/:id',
    name: 'FurnitureModel',
    component: () => import('@/views/FurnitureModel.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/articles',
    name: 'Articles',
    component: () => import('@/views/Articles.vue'),
    meta: { requiresAuth: false, showTabbar: true }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('@/views/ArticleDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: false, showTabbar: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/Favorites.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my-home',
    name: 'MyHome',
    component: () => import('@/views/MyHome.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Messages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/questions',
    name: 'Questions',
    component: () => import('@/views/Questions.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/question/:id',
    name: 'QuestionDetail',
    component: () => import('@/views/QuestionDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/error',
    name: 'Error',
    component: () => import('@/views/Error.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const token = localStorage.getItem('token')
  
  if (token && !userStore.isLoggedIn) {
    try {
      await userStore.getProfile()
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
