import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('@/views/Games.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/games/:code',
    name: 'GameDetail',
    component: () => import('@/views/GameDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/play/:gameCode/:levelId?',
    name: 'PlayGame',
    component: () => import('@/views/PlayGame.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('@/views/Ranking.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/room',
    name: 'RoomList',
    component: () => import('@/views/RoomList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/room/:roomCode',
    name: 'Room',
    component: () => import('@/views/Room.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/teacher',
    name: 'TeacherDashboard',
    component: () => import('@/views/TeacherDashboard.vue'),
    meta: { requiresAuth: true, requiresTeacher: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresTeacher && !userStore.isTeacher) {
    next('/')
  } else if ((to.path === '/login' || to.path === '/register') && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
