import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/landing',
    name: 'Landing',
    component: () => import('@/views/LandingPage.vue'),
    meta: { title: '省呗 - 广告落地页' }
  },
  {
    path: '/jump',
    name: 'Jump',
    component: () => import('@/views/LandingPage.vue'),
    meta: { title: '省呗 - 跳转页面' }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '数据概览' }
  },
  {
    path: '/config/access',
    name: 'AccessConfig',
    component: () => import('@/views/config/AccessConfig.vue'),
    meta: { title: '准入配置' }
  },
  {
    path: '/config/collision',
    name: 'CollisionConfig',
    component: () => import('@/views/config/CollisionConfig.vue'),
    meta: { title: '撞库配置' }
  },
  {
    path: '/config/channels',
    name: 'ChannelConfig',
    component: () => import('@/views/config/ChannelConfig.vue'),
    meta: { title: '渠道管理' }
  },
  {
    path: '/config/products',
    name: 'ProductConfig',
    component: () => import('@/views/config/ProductConfig.vue'),
    meta: { title: '产品管理' }
  },
  {
    path: '/test',
    name: 'ApiTest',
    component: () => import('@/views/ApiTest.vue'),
    meta: { title: '接口测试' }
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('@/views/Records.vue'),
    meta: { title: '请求记录' }
  },
  {
    path: '/blacklist',
    name: 'Blacklist',
    component: () => import('@/views/Blacklist.vue'),
    meta: { title: '黑名单管理' }
  },
  {
    path: '/alerts',
    name: 'Alerts',
    component: () => import('@/views/Alerts.vue'),
    meta: { title: '报警记录' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
