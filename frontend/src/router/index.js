import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'goals',
        name: 'Goals',
        component: () => import('@/views/Goals.vue')
      },
      {
        path: 'goals/:id',
        name: 'GoalDetail',
        component: () => import('@/views/GoalDetail.vue')
      },
      {
        path: 'execution',
        name: 'Execution',
        component: () => import('@/views/Execution.vue')
      },
      {
        path: 'habits',
        name: 'Habits',
        component: () => import('@/views/Habits.vue')
      },
      {
        path: 'deviation',
        name: 'Deviation',
        component: () => import('@/views/Deviation.vue')
      },
      {
        path: 'review',
        name: 'AnnualReview',
        component: () => import('@/views/AnnualReview.vue')
      },
      {
        path: 'export',
        name: 'Export',
        component: () => import('@/views/Export.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/Admin.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.path === '/login' && userStore.token) {
    next('/')
  } else if (!to.meta.requiresAuth) {
    next()
  } else if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.meta.requiresAdmin && userStore.user?.role !== 'admin') {
    ElMessage.error('没有权限访问该页面')
    next('/')
  } else {
    next()
  }
})

export default router
