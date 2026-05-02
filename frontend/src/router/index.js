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
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('../views/Devices.vue')
      },
      {
        path: 'devices/:id',
        name: 'DeviceDetail',
        component: () => import('../views/DeviceDetail.vue')
      },
      {
        path: 'alarms',
        name: 'Alarms',
        component: () => import('../views/Alarms.vue')
      },
      {
        path: 'inspections',
        name: 'Inspections',
        component: () => import('../views/Inspections.vue')
      },
      {
        path: 'todos',
        name: 'TodoTasks',
        component: () => import('../views/TodoTasks.vue')
      },
      {
        path: 'suggestions',
        name: 'EnergySuggestions',
        component: () => import('../views/EnergySuggestions.vue')
      },
      {
        path: 'billing',
        name: 'Billing',
        component: () => import('../views/Billing.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('../views/Reports.vue')
      },
      {
        path: 'audit',
        name: 'AuditLogs',
        component: () => import('../views/AuditLogs.vue')
      },
      {
        path: 'timeline',
        name: 'Timeline',
        component: () => import('../views/Timeline.vue')
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
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
