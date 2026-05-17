import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/community'
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
    path: '/community',
    name: 'Community',
    component: () => import('@/views/Community.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('@/views/PostDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/qa',
    name: 'QA',
    component: () => import('@/views/QA.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/question/:id',
    name: 'QuestionDetail',
    component: () => import('@/views/QuestionDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('@/views/Publish.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/activities',
    name: 'Activities',
    component: () => import('@/views/Activities.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/activity/:id',
    name: 'ActivityDetail',
    component: () => import('@/views/ActivityDetail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/my',
    name: 'My',
    component: () => import('@/views/My.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pets',
    name: 'Pets',
    component: () => import('@/views/Pets.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/pet/:id',
    name: 'PetDetail',
    component: () => import('@/views/PetDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/Messages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:userId',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    if (userStore.isLoggedIn && !userStore.user) {
      try {
        await userStore.fetchUserProfile()
      } catch {
        userStore.logout()
        if (to.meta.requiresAuth) {
          next('/login')
          return
        }
      }
    }
    next()
  }
})

export default router
