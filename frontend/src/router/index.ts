import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        redirect: '/files'
      },
      {
        path: 'files',
        name: 'Files',
        component: () => import('@/views/Files.vue')
      },
      {
        path: 'files/:id/versions',
        name: 'FileVersions',
        component: () => import('@/views/FileVersions.vue')
      },
      {
        path: 'shares',
        name: 'Shares',
        component: () => import('@/views/Shares.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/Admin.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/audit',
        name: 'AuditLogs',
        component: () => import('@/views/AuditLogs.vue'),
        meta: { requiresCompliance: true }
      }
    ]
  },
  {
    path: '/s/:shareCode',
    name: 'PublicShare',
    component: () => import('@/views/PublicShare.vue'),
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true
  const requiresCompliance = to.meta.requiresCompliance === true
  
  if (requiresAuth && !authStore.isAuthenticated) {
    try {
      await authStore.fetchCurrentUser()
    } catch {
      next('/login')
      return
    }
  }
  
  if (requiresAdmin && !authStore.isAdmin) {
    next('/files')
    return
  }
  
  if (requiresCompliance && !authStore.isCompliance) {
    next('/files')
    return
  }
  
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/files')
    return
  }
  
  next()
})

export default router
