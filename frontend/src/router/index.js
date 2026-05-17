import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/posts'
  },
  {
    path: '/posts',
    name: 'Posts',
    component: () => import('@/views/posts/index.vue')
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: () => import('@/views/posts/detail.vue')
  },
  {
    path: '/questions',
    name: 'Questions',
    component: () => import('@/views/questions/index.vue')
  },
  {
    path: '/questions/:id',
    name: 'QuestionDetail',
    component: () => import('@/views/questions/detail.vue')
  },
  {
    path: '/questions/publish',
    name: 'PublishQuestion',
    component: () => import('@/views/questions/publish.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/messages/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/:userId',
    name: 'Chat',
    component: () => import('@/views/messages/chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my',
    name: 'My',
    component: () => import('@/views/my/index.vue')
  },
  {
    path: '/users/:id',
    name: 'UserProfile',
    component: () => import('@/views/users/profile.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/register.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else {
    next()
  }
})

export default router
