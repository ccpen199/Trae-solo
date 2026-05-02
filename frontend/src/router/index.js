import { createRouter, createWebHistory } from 'vue-router'
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
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'tasks',
        name: 'Tasks',
        component: () => import('@/views/Tasks.vue'),
        meta: { requiresAuth: true, roles: ['shipper', 'carrier', 'driver'] }
      },
      {
        path: 'tasks/create',
        name: 'TaskCreate',
        component: () => import('@/views/TaskCreate.vue'),
        meta: { requiresAuth: true, roles: ['shipper'] }
      },
      {
        path: 'tasks/:id',
        name: 'TaskDetail',
        component: () => import('@/views/TaskDetail.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'temperature',
        name: 'Temperature',
        component: () => import('@/views/Temperature.vue'),
        meta: { requiresAuth: true, roles: ['shipper', 'driver', 'quality_control'] }
      },
      {
        path: 'alarms',
        name: 'Alarms',
        component: () => import('@/views/Alarms.vue'),
        meta: { requiresAuth: true, roles: ['driver', 'shipper', 'quality_control'] }
      },
      {
        path: 'inspections',
        name: 'Inspections',
        component: () => import('@/views/Inspections.vue'),
        meta: { requiresAuth: true, roles: ['driver', 'shipper'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'quality',
        name: 'Quality',
        component: () => import('@/views/Quality.vue'),
        meta: { requiresAuth: true, roles: ['quality_control'] }
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
  const token = localStorage.getItem('token')
  
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' })
  } else if (to.meta.roles && token) {
    const userRole = userStore.userInfo?.role
    if (userRole && to.meta.roles.includes(userRole)) {
      next()
    } else {
      next({ name: 'Dashboard' })
    }
  } else {
    next()
  }
})

export default router
