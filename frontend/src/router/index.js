import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/couple/Home.vue'),
        meta: { title: '首页', requiresAuth: true, role: 'couple' }
      },
      {
        path: 'wedding',
        name: 'Wedding',
        component: () => import('@/views/couple/Wedding.vue'),
        meta: { title: '婚礼倒计时', requiresAuth: true, role: 'couple' }
      },
      {
        path: 'budget',
        name: 'Budget',
        component: () => import('@/views/couple/Budget.vue'),
        meta: { title: '预算管理', requiresAuth: true, role: 'couple' }
      },
      {
        path: 'preferences',
        name: 'Preferences',
        component: () => import('@/views/couple/Preferences.vue'),
        meta: { title: '风格偏好', requiresAuth: true, role: 'couple' }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/couple/Services.vue'),
        meta: { title: '商品服务', requiresAuth: true, role: 'couple' }
      },
      {
        path: 'guides',
        name: 'Guides',
        component: () => import('@/views/couple/Guides.vue'),
        meta: { title: '备婚攻略', requiresAuth: true, role: 'couple' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/couple/Orders.vue'),
        meta: { title: '订单中心', requiresAuth: true, role: 'couple' }
      },
      {
        path: 'merchant/dashboard',
        name: 'MerchantDashboard',
        component: () => import('@/views/merchant/Dashboard.vue'),
        meta: { title: '商家首页', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'merchant/certification',
        name: 'Certification',
        component: () => import('@/views/merchant/Certification.vue'),
        meta: { title: '资质认证', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'merchant/cases',
        name: 'Cases',
        component: () => import('@/views/merchant/Cases.vue'),
        meta: { title: '案例管理', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'merchant/schedule',
        name: 'Schedule',
        component: () => import('@/views/merchant/Schedule.vue'),
        meta: { title: '档期管理', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'merchant/orders',
        name: 'MerchantOrders',
        component: () => import('@/views/merchant/Orders.vue'),
        meta: { title: '订单管理', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'merchant/reviews',
        name: 'Reviews',
        component: () => import('@/views/merchant/Reviews.vue'),
        meta: { title: '评价管理', requiresAuth: true, role: 'merchant' }
      },
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '运营首页', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'admin/merchants',
        name: 'MerchantManage',
        component: () => import('@/views/admin/Merchants.vue'),
        meta: { title: '商家管理', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'admin/credit',
        name: 'Credit',
        component: () => import('@/views/admin/Credit.vue'),
        meta: { title: '信用分评估', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'admin/trends',
        name: 'Trends',
        component: () => import('@/views/admin/Trends.vue'),
        meta: { title: '婚策趋势', requiresAuth: true, role: 'admin' }
      },
      {
        path: 'admin/funnel',
        name: 'Funnel',
        component: () => import('@/views/admin/Funnel.vue'),
        meta: { title: '转化漏斗', requiresAuth: true, role: 'admin' }
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
  document.title = to.meta.title ? `${to.meta.title} - 婚庆SaaS平台` : '婚庆SaaS平台'

  if (to.name === 'Login' && userStore.token) {
    next(userStore.homePath || '/dashboard/home')
  } else if (to.meta.requiresAuth && !userStore.token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.meta.role && userStore.token && userStore.user?.role !== to.meta.role) {
    next(userStore.homePath || '/dashboard/home')
  } else {
    next()
  }
})

export default router
