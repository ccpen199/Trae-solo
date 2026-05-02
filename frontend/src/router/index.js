import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/farmer',
    name: 'Farmer',
    component: () => import('../views/farmer/FarmerView.vue'),
    children: [
      { path: 'dashboard', component: () => import('../views/farmer/Dashboard.vue') },
      { path: 'batches', component: () => import('../views/farmer/Batches.vue') },
      { path: 'farming', component: () => import('../views/farmer/FarmingRecords.vue') },
      { path: 'batch/:batchUid', component: () => import('../views/farmer/BatchDetail.vue') }
    ]
  },
  {
    path: '/quality',
    name: 'Quality',
    component: () => import('../views/quality/QualityView.vue'),
    children: [
      { path: 'dashboard', component: () => import('../views/quality/Dashboard.vue') },
      { path: 'inspections', component: () => import('../views/quality/Inspections.vue') },
      { path: 'inspection/:inspectionUid', component: () => import('../views/quality/InspectionDetail.vue') }
    ]
  },
  {
    path: '/flow',
    name: 'Flow',
    component: () => import('../views/flow/FlowView.vue'),
    children: [
      { path: 'dashboard', component: () => import('../views/flow/Dashboard.vue') },
      { path: 'records', component: () => import('../views/flow/FlowRecords.vue') },
      { path: 'batch/:batchUid', component: () => import('../views/flow/BatchFlow.vue') }
    ]
  },
  {
    path: '/consumer',
    name: 'Consumer',
    component: () => import('../views/consumer/ConsumerView.vue'),
    children: [
      { path: 'trace', component: () => import('../views/consumer/TraceView.vue') },
      { path: 'result/:batchCode', component: () => import('../views/consumer/TraceResult.vue') }
    ]
  },
  {
    path: '/recall',
    name: 'Recall',
    component: () => import('../views/recall/RecallView.vue'),
    children: [
      { path: 'dashboard', component: () => import('../views/recall/Dashboard.vue') },
      { path: 'records', component: () => import('../views/recall/RecallRecords.vue') },
      { path: 'create', component: () => import('../views/recall/CreateRecall.vue') },
      { path: 'detail/:recallUid', component: () => import('../views/recall/RecallDetail.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
