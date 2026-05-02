import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dispatch',
    children: [
      {
        path: 'dispatch',
        component: () => import('@/views/dispatch/DispatchLayout.vue'),
        children: [
          { path: '', redirect: '/dispatch/orders' },
          { path: 'orders', name: 'dispatch-orders', component: () => import('@/views/dispatch/OrderList.vue') },
          { path: 'orders/:id', name: 'dispatch-order-detail', component: () => import('@/views/dispatch/OrderDetail.vue') },
          { path: 'dispatch-center', name: 'dispatch-center', component: () => import('@/views/dispatch/DispatchCenter.vue') },
          { path: 'monitor', name: 'dispatch-monitor', component: () => import('@/views/dispatch/MonitorCenter.vue') },
          { path: 'waybill/:id', name: 'dispatch-waybill-detail', component: () => import('@/views/dispatch/WaybillDetail.vue') },
        ]
      },
      {
        path: 'driver',
        component: () => import('@/views/driver/DriverLayout.vue'),
        children: [
          { path: '', redirect: '/driver/waybills' },
          { path: 'waybills', name: 'driver-waybills', component: () => import('@/views/driver/WaybillList.vue') },
          { path: 'waybills/:id', name: 'driver-waybill-detail', component: () => import('@/views/driver/WaybillDetail.vue') },
          { path: 'track/:id', name: 'driver-track', component: () => import('@/views/driver/TrackView.vue') },
        ]
      },
      {
        path: 'customer',
        component: () => import('@/views/customer/CustomerLayout.vue'),
        children: [
          { path: '', redirect: '/customer/orders' },
          { path: 'orders', name: 'customer-orders', component: () => import('@/views/customer/OrderList.vue') },
          { path: 'orders/:id', name: 'customer-order-detail', component: () => import('@/views/customer/OrderDetail.vue') },
          { path: 'track/:id', name: 'customer-track', component: () => import('@/views/customer/TrackView.vue') },
          { path: 'statements', name: 'customer-statements', component: () => import('@/views/customer/Statements.vue') },
        ]
      },
      {
        path: 'finance',
        component: () => import('@/views/finance/FinanceLayout.vue'),
        children: [
          { path: '', redirect: '/finance/freights' },
          { path: 'freights', name: 'finance-freights', component: () => import('@/views/finance/FreightList.vue') },
          { path: 'freights/:id', name: 'finance-freight-detail', component: () => import('@/views/finance/FreightDetail.vue') },
          { path: 'statements', name: 'finance-statements', component: () => import('@/views/finance/StatementList.vue') },
          { path: 'statements/:id', name: 'finance-statement-detail', component: () => import('@/views/finance/StatementDetail.vue') },
          { path: 'reports', name: 'finance-reports', component: () => import('@/views/finance/Reports.vue') },
        ]
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/common/Login.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
