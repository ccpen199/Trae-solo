import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '健康度仪表盘' }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/AdminDashboard.vue'),
    meta: { title: '管理后台' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: { title: '企业查询' }
  },
  {
    path: '/enterprise/:id',
    name: 'EnterpriseDetail',
    component: () => import('@/views/EnterpriseDetail.vue'),
    meta: { title: '企业详情' }
  },
  {
    path: '/saas/rules',
    name: 'RiskRules',
    component: () => import('@/views/RiskRules.vue'),
    meta: { title: '风控规则配置' }
  },
  {
    path: '/risk-rules',
    redirect: '/saas/rules'
  },
  {
    path: '/saas/reports',
    name: 'Reports',
    component: () => import('@/views/Reports.vue'),
    meta: { title: '尽调报告' }
  },
  {
    path: '/credit',
    name: 'CreditManagement',
    component: () => import('@/views/CreditManagement.vue'),
    meta: { title: '信用管理' }
  },
  {
    path: '/mobile',
    name: 'Mobile',
    component: () => import('@/views/Mobile.vue'),
    meta: { title: '移动端' }
  },
  {
    path: '/mobile/offline',
    name: 'OfflineArchives',
    component: () => import('@/views/OfflineArchives.vue'),
    meta: { title: '离线档案' }
  },
  {
    path: '/mobile/qrcode',
    name: 'QRCodeScanner',
    component: () => import('@/views/QRCodeScanner.vue'),
    meta: { title: '扫码查询' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 建筑风控平台` : '建筑行业企业级风控数据服务平台';
  next();
});

export default router;
