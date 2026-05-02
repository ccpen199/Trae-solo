import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/cases',
    children: [
      {
        path: 'cases',
        name: 'CaseList',
        component: () => import('../views/cases/List.vue'),
        meta: { title: '案件列表' }
      },
      {
        path: 'cases/create',
        name: 'CaseCreate',
        component: () => import('../views/cases/Create.vue'),
        meta: { title: '创建案件', roles: ['lead_lawyer', 'assistant'] }
      },
      {
        path: 'cases/:id',
        name: 'CaseDetail',
        component: () => import('../views/cases/Detail.vue'),
        meta: { title: '案件详情' }
      },
      {
        path: 'cases/:id/evidences',
        name: 'CaseEvidences',
        component: () => import('../views/cases/Evidences.vue'),
        meta: { title: '证据管理' }
      },
      {
        path: 'cases/:id/documents',
        name: 'CaseDocuments',
        component: () => import('../views/cases/Documents.vue'),
        meta: { title: '文书管理' }
      },
      {
        path: 'cases/:id/accounting',
        name: 'CaseAccounting',
        component: () => import('../views/cases/Accounting.vue'),
        meta: { title: '账务管理', roles: ['lead_lawyer', 'finance'] }
      },
      {
        path: 'cases/:id/timeline',
        name: 'CaseTimeline',
        component: () => import('../views/cases/Timeline.vue'),
        meta: { title: '办案轨迹' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  document.title = to.meta.title ? `${to.meta.title} - 法律案件管理系统` : '法律案件管理系统'
  
  if (to.meta.requiresAuth === false) {
    next()
    return
  }
  
  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (!userStore.userInfo) {
    await userStore.fetchUserInfo()
  }
  
  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(userStore.role)) {
      next({ path: '/cases' })
      return
    }
  }
  
  next()
})

export default router
