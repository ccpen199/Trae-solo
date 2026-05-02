import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Main',
    component: () => import('../views/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('../views/Tasks.vue'),
        meta: { title: '任务管理', module: 'tasks' }
      },
      {
        path: 'tasks/create',
        name: 'TaskCreate',
        component: () => import('../views/TaskForm.vue'),
        meta: { title: '创建任务', module: 'tasks' }
      },
      {
        path: 'tasks/:taskUuid',
        name: 'TaskDetail',
        component: () => import('../views/TaskDetail.vue'),
        meta: { title: '任务详情', module: 'tasks' }
      },
      {
        path: 'progress',
        name: 'Progress',
        component: () => import('../views/Progress.vue'),
        meta: { title: '进度管理', module: 'progress' }
      },
      {
        path: 'achievements',
        name: 'Achievements',
        component: () => import('../views/Achievements.vue'),
        meta: { title: '成就管理', module: 'achievements' }
      },
      {
        path: 'rewards',
        name: 'Rewards',
        component: () => import('../views/Rewards.vue'),
        meta: { title: '奖励管理', module: 'rewards' }
      },
      {
        path: 'triggers',
        name: 'Triggers',
        component: () => import('../views/Triggers.vue'),
        meta: { title: '触发事件', module: 'triggers' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/Reports.vue'),
        meta: { title: '报表分析', module: 'reports' }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/Analytics.vue'),
        meta: { title: '数据分析', module: 'analytics' }
      },
      {
        path: 'audits',
        name: 'Audits',
        component: () => import('../views/Audits.vue'),
        meta: { title: '审计日志', module: 'audits' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理', module: 'users' }
      },
      {
        path: 'cross-reference',
        name: 'CrossReference',
        component: () => import('../views/CrossReference.vue'),
        meta: { title: '数据回查', module: 'audits' }
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
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  if (requiresAuth && !userStore.isLoggedIn) {
    if (userStore.userUuid) {
      await userStore.getCurrentUser()
      if (userStore.isLoggedIn) {
        next()
        return
      }
    }
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
