import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { requiresAuth: false } },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/conversations',
    meta: { requiresAuth: true },
    children: [
      { path: 'conversations', name: 'Conversations', component: () => import('../views/Conversations.vue'), meta: { requiresAuth: true } },
      { path: 'chat/:id', name: 'Chat', component: () => import('../views/Chat.vue'), props: true, meta: { requiresAuth: true } },
      { path: 'reports', name: 'Reports', component: () => import('../views/Reports.vue'), meta: { requiresAuth: true, roles: ['moderator', 'admin'] } },
      { path: 'statistics', name: 'Statistics', component: () => import('../views/Statistics.vue'), meta: { requiresAuth: true, roles: ['moderator', 'admin', 'cs'] } },
      { path: 'users', name: 'Users', component: () => import('../views/Users.vue'), meta: { requiresAuth: true, roles: ['admin'] } },
      { path: 'sensitive-words', name: 'SensitiveWords', component: () => import('../views/SensitiveWords.vue'), meta: { requiresAuth: true, roles: ['admin', 'moderator'] } },
      { path: 'audit-logs', name: 'AuditLogs', component: () => import('../views/AuditLogs.vue'), meta: { requiresAuth: true, roles: ['admin'] } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/conversations' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  let userStore = null
  try {
    userStore = useUserStore()
    userStore.syncFromStorage()
  } catch (e) {
    console.warn('Store not ready yet', e)
  }

  const isLoggedIn = userStore ? userStore.isLoggedIn : !!localStorage.getItem('token')

  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath, error: encodeURIComponent('请先登录') } })
    return
  }

  if (to.path === '/login' && isLoggedIn) {
    next('/')
    return
  }

  if (to.meta.roles && userStore) {
    const userRole = userStore.userRole
    if (!to.meta.roles.includes(userRole)) {
      next({ path: '/conversations', query: { error: encodeURIComponent('权限不足') } })
      return
    }
  }

  next()
})

export default router
