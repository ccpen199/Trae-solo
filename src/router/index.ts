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
    path: '/admin/auditing',
    name: 'admin-auditing',
    component: {
      template: `
        <div class="p-8">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">对账审计</h1>
          <p class="text-gray-500">该功能正在开发中，敬请期待...</p>
          <div class="mt-6 card-base p-6">
            <h2 class="text-lg font-semibold mb-4">本月对账概览</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-bg-50 rounded-lg">
                <div class="text-sm text-gray-500">本月对账</div>
                <div class="text-2xl font-bold text-brand-600">256笔</div>
              </div>
              <div class="p-4 bg-bg-50 rounded-lg">
                <div class="text-sm text-gray-500">待确认</div>
                <div class="text-2xl font-bold text-red-600">12笔</div>
              </div>
              <div class="p-4 bg-bg-50 rounded-lg">
                <div class="text-sm text-gray-500">差异率</div>
                <div class="text-2xl font-bold text-green-600">1.2%</div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    meta: { layout: 'admin', title: '对账审计 - 德邦大件运营管理平台', requiresAuth: true }
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
