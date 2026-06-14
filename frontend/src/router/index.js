import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'producer/wastes',
        name: 'ProducerWastes',
        component: () => import('@/views/producer/WasteList.vue'),
        meta: { title: '废弃物管理', role: 'producer' }
      },
      {
        path: 'producer/waste-publish',
        name: 'ProducerWastePublish',
        component: () => import('@/views/producer/WastePublish.vue'),
        meta: { title: '发布废弃物', role: 'producer' }
      },
      {
        path: 'producer/estimate',
        name: 'ProducerEstimate',
        component: () => import('@/views/producer/PriceEstimate.vue'),
        meta: { title: '智能估价', role: 'producer' }
      },
      {
        path: 'producer/appointments',
        name: 'ProducerAppointments',
        component: () => import('@/views/producer/AppointmentList.vue'),
        meta: { title: '预约回收', role: 'producer' }
      },
      {
        path: 'producer/appointment-create',
        name: 'ProducerAppointmentCreate',
        component: () => import('@/views/producer/AppointmentCreate.vue'),
        meta: { title: '新建预约', role: 'producer' }
      },
      {
        path: 'producer/orders',
        name: 'ProducerOrders',
        component: () => import('@/views/producer/OrderList.vue'),
        meta: { title: '我的订单', role: 'producer' }
      },
      {
        path: 'producer/orders/:id',
        name: 'ProducerOrderDetail',
        component: () => import('@/views/producer/OrderDetail.vue'),
        meta: { title: '订单详情', role: 'producer' }
      },
      {
        path: 'producer/contracts',
        name: 'ProducerContracts',
        component: () => import('@/views/producer/ContractList.vue'),
        meta: { title: '电子合同', role: 'producer' }
      },
      {
        path: 'collector/schedules',
        name: 'CollectorSchedules',
        component: () => import('@/views/collector/ScheduleList.vue'),
        meta: { title: '回收调度', role: 'collector' }
      },
      {
        path: 'collector/schedules/:id',
        name: 'CollectorScheduleDetail',
        component: () => import('@/views/collector/ScheduleDetail.vue'),
        meta: { title: '调度详情', role: 'collector' }
      },
      {
        path: 'collector/schedule-create',
        name: 'CollectorScheduleCreate',
        component: () => import('@/views/collector/ScheduleCreate.vue'),
        meta: { title: '创建调度', role: 'collector' }
      },
      {
        path: 'collector/weigh-tickets',
        name: 'CollectorWeighTickets',
        component: () => import('@/views/collector/WeighTicketList.vue'),
        meta: { title: '电子磅单', role: 'collector' }
      },
      {
        path: 'collector/weigh-tickets/:id',
        name: 'CollectorWeighTicketDetail',
        component: () => import('@/views/collector/WeighTicketDetail.vue'),
        meta: { title: '磅单详情', role: 'collector' }
      },
      {
        path: 'collector/orders',
        name: 'CollectorOrders',
        component: () => import('@/views/collector/OrderList.vue'),
        meta: { title: '我的订单', role: 'collector' }
      },
      {
        path: 'collector/vehicles',
        name: 'CollectorVehicles',
        component: () => import('@/views/collector/VehicleList.vue'),
        meta: { title: '车辆管理', role: 'collector' }
      },
      {
        path: 'collector/vehicle-form',
        name: 'CollectorVehicleForm',
        component: () => import('@/views/collector/VehicleForm.vue'),
        meta: { title: '车辆表单', role: 'collector' }
      },
      {
        path: 'processor/market',
        name: 'ProcessorMarket',
        component: () => import('@/views/processor/MarketList.vue'),
        meta: { title: '采购市场', role: 'processor' }
      },
      {
        path: 'processor/purchases',
        name: 'ProcessorPurchases',
        component: () => import('@/views/processor/PurchaseList.vue'),
        meta: { title: '我的采购', role: 'processor' }
      },
      {
        path: 'processor/trace',
        name: 'ProcessorTrace',
        component: () => import('@/views/processor/TraceQuery.vue'),
        meta: { title: '溯源查询', role: 'processor' }
      },
      {
        path: 'admin/stats',
        name: 'AdminStats',
        component: () => import('@/views/admin/StatsDashboard.vue'),
        meta: { title: '数据统计', role: 'admin' }
      },
      {
        path: 'admin/hazardous-review',
        name: 'AdminHazardousReview',
        component: () => import('@/views/admin/HazardousReview.vue'),
        meta: { title: '危废审核', role: 'admin' }
      },
      {
        path: 'admin/transfer-orders',
        name: 'AdminTransferOrders',
        component: () => import('@/views/admin/TransferOrderList.vue'),
        meta: { title: '跨省转移联单', role: 'admin' }
      },
      {
        path: 'admin/user-audit',
        name: 'AdminUserAudit',
        component: () => import('@/views/admin/UserAudit.vue'),
        meta: { title: '用户审核', role: 'admin' }
      },
      {
        path: 'admin/env-report',
        name: 'AdminEnvReport',
        component: () => import('@/views/admin/EnvReport.vue'),
        meta: { title: '环保监管报送', role: 'admin' }
      },
      {
        path: 'admin/blockchain',
        name: 'AdminBlockchain',
        component: () => import('@/views/admin/BlockchainCenter.vue'),
        meta: { title: '区块链存证', role: 'admin' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
