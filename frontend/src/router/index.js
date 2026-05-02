import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'Odometer' }
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/projects/ProjectList.vue'),
        meta: { title: '项目列表', icon: 'Folder' }
      },
      {
        path: 'projects/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/projects/ProjectDetail.vue'),
        meta: { title: '项目详情', hidden: true }
      },
      {
        path: 'projects/:id/kanban',
        name: 'ProjectKanban',
        component: () => import('@/views/projects/ProjectKanban.vue'),
        meta: { title: '任务看板', hidden: true }
      },
      {
        path: 'projects/:id/gantt',
        name: 'ProjectGantt',
        component: () => import('@/views/projects/ProjectGantt.vue'),
        meta: { title: '甘特图', hidden: true }
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/Exceptions.vue'),
        meta: { title: '异常队列', icon: 'Warning' }
      },
      {
        path: 'todos',
        name: 'Todos',
        component: () => import('@/views/Todos.vue'),
        meta: { title: '我的待办', icon: 'Document' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 项目协作管理系统` : '项目协作管理系统'
  
  const userStore = useUserStore()
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth !== false && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.name === 'Login' && token) {
    next({ name: 'Dashboard' })
    return
  }

  if (token && !userStore.user) {
    try {
      await userStore.fetchUserInfo()
    } catch (error) {
      console.error('获取用户信息失败:', error)
      localStorage.removeItem('token')
      next({ name: 'Login' })
      return
    }
  }

  next()
})

export default router
