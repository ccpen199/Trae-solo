import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页', requiresAuth: false }
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('@/views/Services.vue'),
    meta: { title: '服务大厅' }
  },
  {
    path: '/service/:id',
    name: 'ServiceDetail',
    component: () => import('@/views/ServiceDetail.vue'),
    meta: { title: '服务详情' }
  },
  {
    path: '/apply/:id',
    name: 'Apply',
    component: () => import('@/views/Apply.vue'),
    meta: { title: '在线办理', requiresAuth: true }
  },
  {
    path: '/certificates',
    name: 'Certificates',
    component: () => import('@/views/Certificates.vue'),
    meta: { title: '电子证照', requiresAuth: true }
  },
  {
    path: '/applications',
    name: 'Applications',
    component: () => import('@/views/Applications.vue'),
    meta: { title: '我的办件', requiresAuth: true }
  },
  {
    path: '/application/:id',
    name: 'ApplicationDetail',
    component: () => import('@/views/ApplicationDetail.vue'),
    meta: { title: '办件详情', requiresAuth: true }
  },
  {
    path: '/workorder',
    name: 'WorkOrder',
    component: () => import('@/views/WorkOrder.vue'),
    meta: { title: '诉求反馈' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/themes/gba',
    name: 'GBATheme',
    component: () => import('@/views/themes/GBA.vue'),
    meta: { title: '粤港澳大湾区专窗' }
  },
  {
    path: '/themes/elder',
    name: 'ElderTheme',
    component: () => import('@/views/themes/Elder.vue'),
    meta: { title: '老年人关爱模式' }
  },
  {
    path: '/themes/enterprise',
    name: 'EnterpriseTheme',
    component: () => import('@/views/themes/Enterprise.vue'),
    meta: { title: '助企纾困政策直达' }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/admin/Login.vue'),
    meta: { title: '管理后台登录' }
  },
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/dashboard',
    meta: { requiresAdmin: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/Dashboard.vue'),
    meta: { title: '管理控制台', requiresAdmin: true }
  },
  {
    path: '/admin/applications',
    name: 'AdminApplications',
    component: () => import('@/views/admin/Applications.vue'),
    meta: { title: '办件管理', requiresAdmin: true }
  },
  {
    path: '/admin/workorders',
    name: 'AdminWorkOrders',
    component: () => import('@/views/admin/WorkOrders.vue'),
    meta: { title: '工单管理', requiresAdmin: true }
  },
  {
    path: '/admin/services',
    name: 'AdminServices',
    component: () => import('@/views/admin/Services.vue'),
    meta: { title: '服务事项管理', requiresAdmin: true }
  },
  {
    path: '/admin/monitor',
    name: 'AdminMonitor',
    component: () => import('@/views/admin/Monitor.vue'),
    meta: { title: '系统监控', requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 广东省一体化移动政务服务平台` : '广东省一体化移动政务服务平台'
  
  const token = localStorage.getItem('gov_token')
  const adminToken = localStorage.getItem('admin_token')

  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresAdmin && !adminToken) {
    next({ path: '/admin/login' })
    return
  }

  next()
})

export default router
