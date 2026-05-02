import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', icon: 'DataBoard' }
      },
      {
        path: 'kanban',
        name: 'Kanban',
        component: () => import('@/views/Kanban.vue'),
        meta: { title: '看板', icon: 'Menu' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '主单列表', icon: 'List' }
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/OrderEdit.vue'),
        meta: { title: '新建流水线单', icon: 'Plus' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { title: '主单详情', icon: 'Document' }
      },
      {
        path: 'pipelines',
        name: 'Pipelines',
        component: () => import('@/views/Pipelines.vue'),
        meta: { title: '流水线管理', icon: 'Connection' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { title: '报表中心', icon: 'TrendCharts' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - CI/CD 持续集成平台` : 'CI/CD 持续集成平台'
  
  const userStore = useUserStore()
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth !== false && !token && !userStore.user) {
    next('/login')
  } else {
    next()
  }
})

export default router
