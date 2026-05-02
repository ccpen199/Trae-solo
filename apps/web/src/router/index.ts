import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requireAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requireAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled', requireAuth: true },
      },
      {
        path: 'purchase',
        name: 'Purchase',
        meta: { title: '采购管理', icon: 'ShoppingCart', requireAuth: true },
        children: [
          {
            path: 'supplier',
            name: 'Supplier',
            component: () => import('@/views/purchase/supplier/index.vue'),
            meta: { title: '供应商管理', requireAuth: true },
          },
          {
            path: 'material',
            name: 'Material',
            component: () => import('@/views/purchase/material/index.vue'),
            meta: { title: '原料管理', requireAuth: true },
          },
          {
            path: 'inbound',
            name: 'MaterialInbound',
            component: () => import('@/views/purchase/inbound/index.vue'),
            meta: { title: '原料入库', requireAuth: true },
          },
        ],
      },
      {
        path: 'production',
        name: 'Production',
        meta: { title: '生产管理', icon: 'Setting', requireAuth: true },
        children: [
          {
            path: 'product',
            name: 'Product',
            component: () => import('@/views/production/product/index.vue'),
            meta: { title: '产品管理', requireAuth: true },
          },
          {
            path: 'bom',
            name: 'BOM',
            component: () => import('@/views/production/bom/index.vue'),
            meta: { title: 'BOM配方管理', requireAuth: true },
          },
          {
            path: 'work-order',
            name: 'WorkOrder',
            component: () => import('@/views/production/work-order/index.vue'),
            meta: { title: '生产工单', requireAuth: true },
          },
          {
            path: 'requisition',
            name: 'MaterialRequisition',
            component: () => import('@/views/production/requisition/index.vue'),
            meta: { title: '领料管理', requireAuth: true },
          },
          {
            path: 'process',
            name: 'Process',
            component: () => import('@/views/production/process/index.vue'),
            meta: { title: '工序上报', requireAuth: true },
          },
        ],
      },
      {
        path: 'quality',
        name: 'Quality',
        meta: { title: '质量管理', icon: 'CircleCheck', requireAuth: true },
        children: [
          {
            path: 'inspection',
            name: 'Inspection',
            component: () => import('@/views/quality/inspection/index.vue'),
            meta: { title: '批次质检', requireAuth: true },
          },
          {
            path: 'product-inbound',
            name: 'ProductInbound',
            component: () => import('@/views/quality/product-inbound/index.vue'),
            meta: { title: '成品入库', requireAuth: true },
          },
        ],
      },
      {
        path: 'warehouse',
        name: 'Warehouse',
        meta: { title: '仓库管理', icon: 'OfficeBuilding', requireAuth: true },
        children: [
          {
            path: 'inventory',
            name: 'Inventory',
            component: () => import('@/views/warehouse/inventory/index.vue'),
            meta: { title: '库存台账', requireAuth: true },
          },
          {
            path: 'shipment',
            name: 'Shipment',
            component: () => import('@/views/warehouse/shipment/index.vue'),
            meta: { title: '销售发货', requireAuth: true },
          },
          {
            path: 'batch',
            name: 'Batch',
            component: () => import('@/views/warehouse/batch/index.vue'),
            meta: { title: '批次管理', requireAuth: true },
          },
        ],
      },
      {
        path: 'traceability',
        name: 'Traceability',
        meta: { title: '质量追溯', icon: 'Connection', requireAuth: true },
        children: [
          {
            path: 'query',
            name: 'TraceabilityQuery',
            component: () => import('@/views/traceability/query/index.vue'),
            meta: { title: '批次回溯', requireAuth: true },
          },
        ],
      },
      {
        path: 'report',
        name: 'Report',
        meta: { title: '报表统计', icon: 'DataAnalysis', requireAuth: true },
        children: [
          {
            path: 'production',
            name: 'ProductionReport',
            component: () => import('@/views/report/production/index.vue'),
            meta: { title: '生产报表', requireAuth: true },
          },
          {
            path: 'inventory',
            name: 'InventoryReport',
            component: () => import('@/views/report/inventory/index.vue'),
            meta: { title: '库存报表', requireAuth: true },
          },
        ],
      },
      {
        path: 'system',
        name: 'System',
        meta: { title: '系统管理', icon: 'Tools', requireAuth: true },
        children: [
          {
            path: 'user',
            name: 'User',
            component: () => import('@/views/system/user/index.vue'),
            meta: { title: '用户管理', requireAuth: true },
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

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 食品生产管理系统` : '食品生产管理系统'

  const userStore = useUserStore()
  const requireAuth = to.meta.requireAuth !== false

  if (requireAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next('/login')
  } else {
    next()
  }
})

export default router
