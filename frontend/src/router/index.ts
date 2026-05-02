import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板' }
      },
      {
        path: 'forms',
        name: 'FormList',
        component: () => import('@/views/FormList.vue'),
        meta: { title: '表单列表' }
      },
      {
        path: 'forms/design/:id?',
        name: 'FormDesigner',
        component: () => import('@/views/FormDesigner.vue'),
        meta: { title: '表单设计器' }
      },
      {
        path: 'forms/submit/:code',
        name: 'FormSubmit',
        component: () => import('@/views/FormSubmit.vue'),
        meta: { title: '表单填报' }
      },
      {
        path: 'submissions',
        name: 'SubmissionList',
        component: () => import('@/views/SubmissionList.vue'),
        meta: { title: '提交记录' }
      },
      {
        path: 'submissions/:id',
        name: 'SubmissionDetail',
        component: () => import('@/views/SubmissionDetail.vue'),
        meta: { title: '提交详情' }
      },
      {
        path: 'audit',
        name: 'AuditTimeline',
        component: () => import('@/views/AuditTimeline.vue'),
        meta: { title: '审计时间线' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn) {
    userStore.restoreFromStorage()
  }
  
  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
