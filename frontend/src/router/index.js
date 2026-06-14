import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'services',
        name: 'ServiceList',
        component: () => import('@/views/ServiceList.vue'),
        meta: { title: '服务事项' }
      },
      {
        path: 'services/:id',
        name: 'ServiceDetail',
        component: () => import('@/views/ServiceDetail.vue'),
        meta: { title: '事项详情' }
      },
      {
        path: 'scenarios',
        name: 'ScenarioList',
        component: () => import('@/views/ScenarioList.vue'),
        meta: { title: '一件事服务' }
      },
      {
        path: 'scenarios/:id',
        name: 'ScenarioDetail',
        component: () => import('@/views/ScenarioDetail.vue'),
        meta: { title: '一件事详情' }
      },
      {
        path: 'policies',
        name: 'PolicyList',
        component: () => import('@/views/PolicyList.vue'),
        meta: { title: '政策解读' }
      },
      {
        path: 'policies/:id',
        name: 'PolicyDetail',
        component: () => import('@/views/PolicyDetail.vue'),
        meta: { title: '政策详情' }
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('@/views/Chat.vue'),
        meta: { title: '智能问答' }
      },
      {
        path: 'apply/:id',
        name: 'Apply',
        component: () => import('@/views/Apply.vue'),
        meta: { title: '在线办理', requiresAuth: true }
      },
      {
        path: 'profile',
        component: () => import('@/layouts/ProfileLayout.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: '',
            name: 'Profile',
            component: () => import('@/views/profile/Index.vue'),
            meta: { title: '个人中心' }
          },
          {
            path: 'applications',
            name: 'MyApplications',
            component: () => import('@/views/profile/Applications.vue'),
            meta: { title: '我的办件' }
          },
          {
            path: 'applications/:id',
            name: 'ApplicationDetail',
            component: () => import('@/views/profile/ApplicationDetail.vue'),
            meta: { title: '办件详情' }
          },
          {
            path: 'evaluations',
            name: 'MyEvaluations',
            component: () => import('@/views/profile/Evaluations.vue'),
            meta: { title: '我的评价' }
          },
          {
            path: 'certificates',
            name: 'MyCertificates',
            component: () => import('@/views/profile/Certificates.vue'),
            meta: { title: '我的证照' }
          },
          {
            path: 'notifications',
            name: 'MyNotifications',
            component: () => import('@/views/profile/Notifications.vue'),
            meta: { title: '消息通知' }
          }
        ]
      },
      {
        path: 'admin',
        component: () => import('@/layouts/AdminLayout.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
          {
            path: '',
            name: 'AdminDashboard',
            component: () => import('@/views/admin/Dashboard.vue'),
            meta: { title: '管理工作台' }
          },
          {
            path: 'service-items',
            name: 'AdminServiceItems',
            component: () => import('@/views/admin/ServiceItems.vue'),
            meta: { title: '事项管理' }
          },
          {
            path: 'scenarios',
            name: 'AdminScenarios',
            component: () => import('@/views/admin/Scenarios.vue'),
            meta: { title: '场景服务管理' }
          },
          {
            path: 'applications',
            name: 'AdminApplications',
            component: () => import('@/views/admin/Applications.vue'),
            meta: { title: '办件管理' }
          },
          {
            path: 'applications/:id',
            name: 'AdminApplicationDetail',
            component: () => import('@/views/admin/ApplicationDetail.vue'),
            meta: { title: '办件详情' }
          },
          {
            path: 'users',
            name: 'AdminUsers',
            component: () => import('@/views/admin/Users.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: 'departments',
            name: 'AdminDepartments',
            component: () => import('@/views/admin/Departments.vue'),
            meta: { title: '部门管理' }
          },
          {
            path: 'regions',
            name: 'AdminRegions',
            component: () => import('@/views/admin/Regions.vue'),
            meta: { title: '区域管理' }
          },
          {
            path: 'statistics',
            name: 'AdminStatistics',
            component: () => import('@/views/admin/Statistics.vue'),
            meta: { title: '统计分析' }
          },
          {
            path: 'audit-logs',
            name: 'AdminAuditLogs',
            component: () => import('@/views/admin/AuditLogs.vue'),
            meta: { title: '审计日志' }
          },
          {
            path: 'alerts',
            name: 'AdminAlerts',
            component: () => import('@/views/admin/Alerts.vue'),
            meta: { title: '异常预警' }
          },
          {
            path: 'evaluations',
            name: 'AdminEvaluations',
            component: () => import('@/views/admin/Evaluations.vue'),
            meta: { title: '评价管理' }
          },
          {
            path: 'policies',
            name: 'AdminPolicies',
            component: () => import('@/views/admin/Policies.vue'),
            meta: { title: '政策管理' }
          }
        ]
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  document.title = to.meta.title ? `${to.meta.title} - 四川政务服务` : '四川政务服务'
  
  if (to.name === 'Login' && userStore.isLoggedIn) {
    next(userStore.getDefaultRoute())
    return
  }
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.requiresAuth && userStore.isLoggedIn && !userStore.userInfo) {
    await userStore.fetchCurrentUser()
    if (!userStore.userInfo) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next({ name: 'Home' })
    return
  }
  
  next()
})

export default router
