import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/Home.vue')
  },
  {
    path: '/bar/:id',
    name: 'BarDetail',
    component: () => import('@/views/bar/BarDetail.vue')
  },
  {
    path: '/entry/:id',
    name: 'EntryDetail',
    component: () => import('@/views/entry/EntryDetail.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'bars',
        name: 'AdminBars',
        component: () => import('@/views/admin/Bars.vue')
      },
      {
        path: 'entries',
        name: 'AdminEntries',
        component: () => import('@/views/admin/Entries.vue')
      },
      {
        path: 'owners',
        name: 'AdminOwners',
        component: () => import('@/views/admin/Owners.vue')
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/Categories.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  if (!userStore.token && localStorage.getItem('token')) {
    try {
      await userStore.fetchProfile()
    } catch (e) {
      console.log('自动恢复登录失败')
    }
  }

  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
    
    if (to.meta.requiresAdmin && userStore.user?.role !== 'admin') {
      next({ name: 'Home' })
      return
    }
  }

  next()
})

export default router
