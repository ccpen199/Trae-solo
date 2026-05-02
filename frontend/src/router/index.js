import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('@/views/Projects.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/projects/:id',
    name: 'ProjectDetail',
    component: () => import('@/views/ProjectDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/ngo/projects',
    name: 'NgoProjects',
    component: () => import('@/views/NgoProjects.vue'),
    meta: { requiresAuth: true, role: 'ngo' }
  },
  {
    path: '/donations/my',
    name: 'MyDonations',
    component: () => import('@/views/MyDonations.vue'),
    meta: { requiresAuth: true, role: 'donor' }
  },
  {
    path: '/tasks/my',
    name: 'MyTasks',
    component: () => import('@/views/MyTasks.vue'),
    meta: { requiresAuth: true, role: 'executor' }
  },
  {
    path: '/audits',
    name: 'Audits',
    component: () => import('@/views/Audits.vue'),
    meta: { requiresAuth: true, role: 'auditor' }
  },
  {
    path: '/track',
    name: 'Track',
    component: () => import('@/views/Track.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'Dashboard' })
    return
  }
  
  if (to.meta.role && userStore.user?.role !== to.meta.role) {
    next({ name: 'Dashboard' })
    return
  }
  
  next()
})

export default router
