import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: Array<'citizen' | 'admin'>
    title?: string
    layout?: 'frontend' | 'admin' | 'blank'
  }
}

const FrontendLayout = () => import('@/layouts/FrontendLayout.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')
const LoginPage = () => import('@/views/auth/LoginPage.vue')

const frontendRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: FrontendLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/home/HomePage.vue'),
        meta: { title: '首页', layout: 'frontend' },
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/profile/DashboardPage.vue'),
        meta: { title: '个人工作台', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
      {
        path: 'services',
        name: 'services',
        component: () => import('@/views/services/ServiceListPage.vue'),
        meta: { title: '办事服务', layout: 'frontend' },
      },
      {
        path: 'services/:id',
        name: 'service-detail',
        component: () => import('@/views/services/ServiceDetailPage.vue'),
        meta: { title: '服务详情', layout: 'frontend' },
      },
      {
        path: 'apply/:serviceId',
        name: 'apply',
        component: () => import('@/views/apply/ApplyPage.vue'),
        meta: { title: '在线申办', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
      {
        path: 'my-applications',
        name: 'my-applications',
        component: () => import('@/views/profile/MyApplications.vue'),
        meta: { title: '我的办件', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('@/views/profile/ProfilePage.vue'),
        meta: { title: '个人中心', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
      {
        path: 'profile/applications',
        name: 'profile-applications',
        component: () => import('@/views/profile/MyApplications.vue'),
        meta: { title: '我的办件', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
      {
        path: 'profile/licenses',
        name: 'profile-licenses',
        component: () => import('@/views/profile/LicensesPage.vue'),
        meta: { title: '我的证照', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
      {
        path: 'tools',
        name: 'tools',
        component: () => import('@/views/tools/ToolsPage.vue'),
        meta: { title: '便民工具', layout: 'frontend' },
      },
      {
        path: 'tools/calculator',
        name: 'tool-calculator',
        component: () => import('@/views/tools/CalculatorPage.vue'),
        meta: { title: '公积金计算器', layout: 'frontend' },
      },
      {
        path: 'tools/violation',
        name: 'tool-violation',
        component: () => import('@/views/tools/ViolationPage.vue'),
        meta: { title: '违章查询', layout: 'frontend' },
      },
      {
        path: 'tools/venue',
        name: 'tool-venue',
        component: () => import('@/views/tools/VenuePage.vue'),
        meta: { title: '场馆预约', layout: 'frontend' },
      },
      {
        path: 'tools/policy-match',
        name: 'tool-policy-match',
        component: () => import('@/views/tools/PolicyMatchPage.vue'),
        meta: { title: '政策智能匹配', layout: 'frontend' },
      },
      {
        path: 'tools/bus',
        name: 'tool-bus',
        component: () => import('@/views/tools/BusQueryPage.vue'),
        meta: { title: '公交查询', layout: 'frontend' },
      },
      {
        path: 'tools/scenic',
        name: 'tool-scenic',
        component: () => import('@/views/tools/ScenicFlowPage.vue'),
        meta: { title: '景区客流查询', layout: 'frontend' },
      },
      {
        path: 'complaints',
        name: 'complaints',
        component: () => import('@/views/frontend/ComplaintsPage.vue'),
        meta: { title: '投诉建议', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
      {
        path: 'complaints/new',
        name: 'complaints-new',
        component: () => import('@/views/frontend/NewComplaintPage.vue'),
        meta: { title: '提交投诉', layout: 'frontend', requiresAuth: true, roles: ['citizen'] },
      },
    ],
  },
]

const adminRoutes: RouteRecordRaw[] = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardPage.vue'),
        meta: { title: '管理后台', layout: 'admin' },
      },
      {
        path: 'services',
        name: 'admin-services',
        component: () => import('@/views/admin/ServicesPage.vue'),
        meta: { title: '服务管理', layout: 'admin' },
      },
      {
        path: 'services/:id/steps',
        name: 'admin-service-steps',
        component: () => import('@/views/admin/ServiceStepsPage.vue'),
        meta: { title: '流程配置', layout: 'admin' },
      },
      {
        path: 'forms',
        name: 'admin-forms',
        component: () => import('@/views/admin/FormsPage.vue'),
        meta: { title: '表单管理', layout: 'admin' },
      },
      {
        path: 'monitor',
        name: 'admin-monitor',
        component: () => import('@/views/admin/MonitorPage.vue'),
        meta: { title: '实时监控', layout: 'admin' },
      },
      {
        path: 'tickets',
        name: 'admin-tickets',
        component: () => import('@/views/admin/TicketsPage.vue'),
        meta: { title: '工单处理', layout: 'admin' },
      },
      {
        path: 'evaluations',
        name: 'admin-evaluations',
        component: () => import('@/views/admin/EvaluationsPage.vue'),
        meta: { title: '评价管理', layout: 'admin' },
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/views/admin/ReportsPage.vue'),
        meta: { title: '数据报表', layout: 'admin' },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/UsersPage.vue'),
        meta: { title: '用户管理', layout: 'admin' },
      },
    ],
  },
]

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { title: '登录', layout: 'blank' },
  },
]

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...frontendRoutes,
  ...adminRoutes,
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在', layout: 'blank' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  userStore.init()

  if (to.meta.title) {
    document.title = `${to.meta.title} - 抚州政务民生门户`
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
    return
  }

  if (to.meta.roles && userStore.userInfo) {
    if (!to.meta.roles.includes(userStore.userInfo.role as 'citizen' | 'admin')) {
      ElMessage.error('无权访问该页面')
      if (userStore.isAdmin) {
        next('/admin')
      } else {
        next('/')
      }
      return
    }
  }

  if (to.path === '/login' && userStore.isLoggedIn) {
    if (userStore.isAdmin) {
      next('/admin')
    } else {
      next('/dashboard')
    }
    return
  }

  next()
})

export default router
