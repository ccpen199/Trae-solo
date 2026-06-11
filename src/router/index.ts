import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/portal/HomePage.vue'),
    meta: { layout: 'portal', title: '德邦大件物流 - 数字服务门户' }
  },
  {
    path: '/order/create',
    name: 'order-create',
    component: () => import('@/pages/portal/OrderCreatePage.vue'),
    meta: { layout: 'portal', title: '在线下单 - 德邦大件物流' }
  },
  {
    path: '/packaging/quote',
    name: 'packaging-quote',
    component: () => import('@/pages/portal/PackagingQuotePage.vue'),
    meta: { layout: 'portal', title: '包装报价 - 德邦大件物流' }
  },
  {
    path: '/measurement/book',
    name: 'measurement-book',
    component: () => import('@/pages/portal/MeasurementBookPage.vue'),
    meta: { layout: 'portal', title: '上门测量预约 - 德邦大件物流' }
  },
  {
    path: '/tracking/:waybillNo?',
    name: 'tracking',
    component: () => import('@/pages/portal/TrackingMonitorPage.vue'),
    meta: { layout: 'portal', title: '运单追踪监控 - 德邦大件物流' }
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/pages/admin/LoginPage.vue'),
    meta: { layout: 'blank', title: '后台登录 - 德邦大件运营管理平台' }
  },
  {
    path: '/admin/dashboard',
    name: 'admin-dashboard',
    component: () => import('@/pages/admin/DashboardPage.vue'),
    meta: { layout: 'admin', title: '数据概览 - 德邦大件运营管理平台', requiresAuth: true }
  },
  {
    path: '/admin/routing',
    name: 'admin-routing',
    component: () => import('@/pages/admin/RoutingEnginePage.vue'),
    meta: { layout: 'admin', title: '大件路由规划引擎 - 德邦大件运营管理平台', requiresAuth: true }
  },
  {
    path: '/admin/video-review',
    name: 'admin-video-review',
    component: () => import('@/pages/admin/VideoReviewPage.vue'),
    meta: { layout: 'admin', title: '装卸视频审核 - 德邦大件运营管理平台', requiresAuth: true }
  },
  {
    path: '/admin/claims',
    name: 'admin-claims',
    component: () => import('@/pages/admin/ClaimsCenterPage.vue'),
    meta: { layout: 'admin', title: '理赔中心 - 德邦大件运营管理平台', requiresAuth: true }
  },
  {
    path: '/admin/vehicles',
    name: 'admin-vehicles',
    component: () => import('@/pages/admin/VehicleMonitorPage.vue'),
    meta: { layout: 'admin', title: '车辆监控对接 - 德邦大件运营管理平台', requiresAuth: true }
  },
  {
    path: '/enterprise/api-docs',
    name: 'enterprise-api-docs',
    component: () => import('@/pages/enterprise/ApiDocsPage.vue'),
    meta: { layout: 'enterprise', title: '企业API文档 - 德邦大件物流' }
  },
  {
    path: '/enterprise/api-apply',
    name: 'enterprise-api-apply',
    component: () => import('@/pages/enterprise/ApiApplyPage.vue'),
    meta: { layout: 'enterprise', title: 'API对接申请 - 德邦大件物流' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  next()
})

export default router
