import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'DataBoard' }
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('../views/customers/List.vue'),
        meta: { title: '客户管理', icon: 'User' }
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        component: () => import('../views/customers/Detail.vue'),
        meta: { title: '客户详情', hidden: true }
      },
      {
        path: 'assessments',
        name: 'Assessments',
        component: () => import('../views/assessments/List.vue'),
        meta: { title: '风险评估', icon: 'Warning' }
      },
      {
        path: 'assessments/:id',
        name: 'AssessmentDetail',
        component: () => import('../views/assessments/Detail.vue'),
        meta: { title: '评估详情', hidden: true }
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('../views/tasks/List.vue'),
        meta: { title: '挽回任务', icon: 'List' }
      },
      {
        path: 'tasks/:id',
        name: 'TaskDetail',
        component: () => import('../views/tasks/Detail.vue'),
        meta: { title: '任务详情', hidden: true }
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('../views/config/Rules.vue'),
        meta: { title: '规则配置', icon: 'Setting' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('../views/Logs.vue'),
        meta: { title: '操作日志', icon: 'Document' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
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
