import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/track'
  },
  {
    path: '/track',
    name: 'Track',
    component: () => import('../views/PassengerTrack.vue'),
    meta: { title: '旅客查询', icon: 'Search' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '运营概览', icon: 'DataAnalysis' }
      },
      {
        path: 'baggage',
        name: 'BaggageList',
        component: () => import('../views/BaggageList.vue'),
        meta: { title: '行李档案', icon: 'Suitcase' }
      },
      {
        path: 'baggage/create',
        name: 'BaggageCreate',
        component: () => import('../views/BaggageCreate.vue'),
        meta: { title: '录入行李', icon: 'Plus' }
      },
      {
        path: 'baggage/:tag',
        name: 'BaggageDetail',
        component: () => import('../views/BaggageDetail.vue'),
        meta: { title: '行李详情', icon: 'Document' }
      },
      {
        path: 'nodes',
        name: 'NodeTracking',
        component: () => import('../views/NodeTracking.vue'),
        meta: { title: '节点追踪', icon: 'Location' }
      },
      {
        path: 'exceptions',
        name: 'ExceptionList',
        component: () => import('../views/ExceptionList.vue'),
        meta: { title: '异常处理', icon: 'Warning' }
      },
      {
        path: 'exceptions/:inquiryNo',
        name: 'ExceptionDetail',
        component: () => import('../views/ExceptionDetail.vue'),
        meta: { title: '异常详情', icon: 'Document' }
      },
      {
        path: 'compensation',
        name: 'CompensationList',
        component: () => import('../views/CompensationList.vue'),
        meta: { title: '赔付管理', icon: 'Money' }
      },
      {
        path: 'stats',
        name: 'Statistics',
        component: () => import('../views/Statistics.vue'),
        meta: { title: '统计分析', icon: 'TrendCharts' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const title = to.meta.title ? `${to.meta.title} - 机场行李追踪系统` : '机场行李追踪系统'
  document.title = title
  next()
})

export default router
