import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/layouts/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'DashboardHome',
          component: () => import('@/views/Dashboard.vue'),
        },
        {
          path: 'activities',
          name: 'Activities',
          component: () => import('@/views/activities/ActivityList.vue'),
        },
        {
          path: 'activities/:id',
          name: 'ActivityDetail',
          component: () => import('@/views/activities/ActivityDetail.vue'),
          props: true,
        },
        {
          path: 'registrations',
          name: 'Registrations',
          component: () => import('@/views/registrations/RegistrationList.vue'),
        },
        {
          path: 'shifts',
          name: 'Shifts',
          component: () => import('@/views/shifts/ShiftList.vue'),
        },
        {
          path: 'attendances',
          name: 'Attendances',
          component: () => import('@/views/attendances/AttendanceList.vue'),
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/user/Profile.vue'),
        },
        {
          path: 'notifications',
          name: 'Notifications',
          component: () => import('@/views/user/Notifications.vue'),
        },
        {
          path: 'badges',
          name: 'Badges',
          component: () => import('@/views/user/Badges.vue'),
        },
        {
          path: 'credit-records',
          name: 'CreditRecords',
          component: () => import('@/views/user/CreditRecords.vue'),
        },
        {
          path: 'admin/users',
          name: 'AdminUsers',
          component: () => import('@/views/admin/Users.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'admin/anomalies',
          name: 'AdminAnomalies',
          component: () => import('@/views/admin/Anomalies.vue'),
          meta: { roles: ['admin', 'reviewer', 'organizer'] },
        },
        {
          path: 'admin/audit-logs',
          name: 'AdminAuditLogs',
          component: () => import('@/views/admin/AuditLogs.vue'),
          meta: { roles: ['admin', 'reviewer'] },
        },
        {
          path: 'admin/skills',
          name: 'AdminSkills',
          component: () => import('@/views/admin/Skills.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'admin/statistics',
          name: 'AdminStatistics',
          component: () => import('@/views/admin/Statistics.vue'),
          meta: { roles: ['admin', 'reviewer'] },
        },
      ],
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await authStore.fetchCurrentUser()
          next()
          return
        } catch {
          localStorage.removeItem('token')
          next({ name: 'Login', query: { redirect: to.fullPath } })
          return
        }
      }
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    if (to.meta.roles && Array.isArray(to.meta.roles)) {
      const hasRole = to.meta.roles.includes(authStore.user?.role)
      if (!hasRole) {
        next({ name: 'DashboardHome' })
        return
      }
    }
  }

  next()
})

export default router
