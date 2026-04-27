import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' },
      },
      {
        path: 'purchase',
        name: 'Purchase',
        meta: { title: '采购管理', icon: 'ShoppingCart' },
        children: [
          {
            path: 'supplier',
            name: 'Supplier',
            component: () => import('@/views/purchase/supplier/index.vue'),
            meta: { title: '供应商管理' },
          },
          {
            path: 'material',
            name: 'Material',
            component: () => import('@/views/purchase/material/index.vue'),
            meta: { title: '原料管理' },
          },
          {
            path: 'inbound',
            name: 'MaterialInbound',
            component: () => import('@/views/purchase/inbound/index.vue'),
            meta: { title: '原料入库' },
          },
        ],
      },
      {
        path: 'production',
        name: 'Production',
        meta: { title: '生产管理', icon: 'Setting' },
        children: [
          {
            path: 'product',
            name: 'Product',
            component: () => import('@/views/production/product/index.vue'),
            meta: { title: '产品管理' },
          },
          {
            path: 'bom',
            name: 'BOM',
            component: () => import('@/views/production/bom/index.vue'),
            meta: { title: 'BOM配方管理' },
          },
          {
            path: 'work-order',
            name: 'WorkOrder',
            component: () => import('@/views/production/work-order/index.vue'),
            meta: { title: '生产工单' },
          },
          {
            path: 'requisition',
            name: 'MaterialRequisition',
            component: () => import('@/views/production/requisition/index.vue'),
            meta: { title: '领料管理' },
          },
          {
            path: 'process',
            name: 'Process',
            component: () => import('@/views/production/process/index.vue'),
            meta: { title: '工序上报' },
          },
        ],
      },
      {
        path: 'quality',
        name: 'Quality',
        meta: { title: '质量管理', icon: 'CircleCheck' },
        children: [
          {
            path: 'inspection',
            name: 'Inspection',
            component: () => import('@/views/quality/inspection/index.vue'),
            meta: { title: '批次质检' },
          },
          {
            path: 'product-inbound',
            name: 'ProductInbound',
            component: () => import('@/views/quality/product-inbound/index.vue'),
            meta: { title: '成品入库' },
          },
        ],
      },
      {
        path: 'warehouse',
        name: 'Warehouse',
        meta: { title: '仓库管理', icon: 'OfficeBuilding' },
        children: [
          {
            path: 'inventory',
            name: 'Inventory',
            component: () => import('@/views/warehouse/inventory/index.vue'),
            meta: { title: '库存台账' },
          },
          {
            path: 'shipment',
            name: 'Shipment',
            component: () => import('@/views/warehouse/shipment/index.vue'),
            meta: { title: '销售发货' },
          },
          {
            path: 'batch',
            name: 'Batch',
            component: () => import('@/views/warehouse/batch/index.vue'),
            meta: { title: '批次管理' },
          },
        ],
      },
      {
        path: 'traceability',
        name: 'Traceability',
        meta: { title: '质量追溯', icon: 'Connection' },
        children: [
          {
            path: 'query',
            name: 'TraceabilityQuery',
            component: () => import('@/views/traceability/query/index.vue'),
            meta: { title: '批次回溯' },
          },
        ],
      },
      {
        path: 'report',
        name: 'Report',
        meta: { title: '报表统计', icon: 'DataAnalysis' },
        children: [
          {
            path: 'production',
            name: 'ProductionReport',
            component: () => import('@/views/report/production/index.vue'),
            meta: { title: '生产报表' },
          },
          {
            path: 'inventory',
            name: 'InventoryReport',
            component: () => import('@/views/report/inventory/index.vue'),
            meta: { title: '库存报表' },
          },
        ],
      },
      {
        path: 'system',
        name: 'System',
        meta: { title: '系统管理', icon: 'Tools' },
        children: [
          {
            path: 'user',
            name: 'User',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理' },
          },
        ],
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 食品生产管理系统` : '食品生产管理系统'
  next()
})

export default router
