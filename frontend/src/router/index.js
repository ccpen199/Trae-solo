import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/',
      component: () => import('@/views/Layout.vue'),
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '风险看板' }
        },
        {
          path: 'domains',
          name: 'domains',
          component: () => import('@/views/Domains.vue'),
          meta: { title: '域名资产' }
        },
        {
          path: 'certificates',
          name: 'certificates',
          component: () => import('@/views/Certificates.vue'),
          meta: { title: '证书库存' }
        },
        {
          path: 'tasks',
          name: 'tasks',
          component: () => import('@/views/Tasks.vue'),
          meta: { title: '续签任务' }
        },
        {
          path: 'logs',
          name: 'logs',
          component: () => import('@/views/Logs.vue'),
          meta: { title: '变更记录' }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.token) {
    next('/login')
  } else if (to.path === '/login' && authStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
