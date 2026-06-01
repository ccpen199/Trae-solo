import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '监管总览' }
  },
  {
    path: '/platforms',
    name: 'Platforms',
    component: () => import('@/views/PlatformList.vue'),
    meta: { title: '平台企业管理' }
  },
  {
    path: '/drivers',
    name: 'Drivers',
    component: () => import('@/views/DriverList.vue'),
    meta: { title: '司机档案管理' }
  },
  {
    path: '/drivers/:id',
    name: 'DriverDetail',
    component: () => import('@/views/DriverDetail.vue'),
    meta: { title: '司机详情' }
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: () => import('@/views/VehicleList.vue'),
    meta: { title: '车辆档案管理' }
  },
  {
    path: '/vehicles/:id',
    name: 'VehicleDetail',
    component: () => import('@/views/VehicleDetail.vue'),
    meta: { title: '车辆详情' }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/OrderList.vue'),
    meta: { title: '订单抽查管理' }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue'),
    meta: { title: '订单详情' }
  },
  {
    path: '/complaints',
    name: 'Complaints',
    component: () => import('@/views/ComplaintList.vue'),
    meta: { title: '投诉管理' }
  },
  {
    path: '/complaints/:id',
    name: 'ComplaintDetail',
    component: () => import('@/views/ComplaintDetail.vue'),
    meta: { title: '投诉详情' }
  },
  {
    path: '/work-orders',
    name: 'WorkOrders',
    component: () => import('@/views/WorkOrderList.vue'),
    meta: { title: '核查工单管理' }
  },
  {
    path: '/work-orders/:id',
    name: 'WorkOrderDetail',
    component: () => import('@/views/WorkOrderDetail.vue'),
    meta: { title: '工单详情' }
  },
  {
    path: '/cases',
    name: 'Cases',
    component: () => import('@/views/CaseList.vue'),
    meta: { title: '执法案件管理' }
  },
  {
    path: '/cases/:id',
    name: 'CaseDetail',
    component: () => import('@/views/CaseDetail.vue'),
    meta: { title: '案件详情' }
  },
  {
    path: '/penalties',
    name: 'Penalties',
    component: () => import('@/views/PenaltyList.vue'),
    meta: { title: '处罚记录' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/ReportCenter.vue'),
    meta: { title: '监管报表中心' }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('@/views/OperationLog.vue'),
    meta: { title: '操作日志' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 出租车网约车合规监管系统`
  }
  next()
})

export default router
