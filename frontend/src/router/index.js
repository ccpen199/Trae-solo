import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('../views/SoulTest.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/',
    name: 'Planet',
    component: () => import('../views/Planet.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/match',
    name: 'Match',
    component: () => import('../views/Match.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:userId',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/square',
    name: 'Square',
    component: () => import('../views/Square.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:userId',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/Messages.vue'),
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
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    if (!userStore.user) {
      try {
        await userStore.fetchUser()
      } catch (e) {
        userStore.logout()
        next('/login')
        return
      }
    }
    if (!userStore.user?.planet_id) {
      next('/test')
    } else {
      next('/')
    }
  } else if (to.meta.requiresAuth && userStore.isLoggedIn && !userStore.user) {
    try {
      await userStore.fetchUser()
      if (!userStore.user?.planet_id && to.path !== '/test') {
        next('/test')
      } else {
        next()
      }
    } catch (e) {
      userStore.logout()
      next('/login')
    }
  } else {
    next()
  }
})

export default router
