import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/app'

const routes = [
  {
    path: '/',
    redirect: '/movies'
  },
  {
    path: '/movies',
    name: 'Movies',
    component: () => import('../views/Movies.vue')
  },
  {
    path: '/movies/:id',
    name: 'MovieDetail',
    component: () => import('../views/MovieDetail.vue')
  },
  {
    path: '/cinemas',
    name: 'Cinemas',
    component: () => import('../views/Cinemas.vue')
  },
  {
    path: '/cinemas/:id',
    name: 'CinemaDetail',
    component: () => import('../views/CinemaDetail.vue')
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: () => import('../views/Schedule.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()
  if (!appStore.isInited) {
    await appStore.initApp()
  }
  next()
})

export default router
