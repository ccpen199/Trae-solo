import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '渝快办' }
  },
  {
    path: '/workbench',
    name: 'Workbench',
    component: () => import('../views/Workbench.vue'),
    meta: { title: '工作台' }
  },
  {
    path: '/identity',
    name: 'Identity',
    component: () => import('../views/Identity.vue'),
    meta: { title: '码上办' }
  },
  {
    path: '/identity/code',
    name: 'IdentityCode',
    component: () => import('../views/IdentityCode.vue'),
    meta: { title: '电子身份码', hideTabBar: true }
  },
  {
    path: '/identity/certificates',
    name: 'Certificates',
    component: () => import('../views/Certificates.vue'),
    meta: { title: '我的证件' }
  },
  {
    path: '/identity/risk',
    name: 'RiskAssessment',
    component: () => import('../views/RiskAssessment.vue'),
    meta: { title: '风险评估', hideTabBar: true }
  },
  {
    path: '/identity/records',
    name: 'CodeRecords',
    component: () => import('../views/CodeRecords.vue'),
    meta: { title: '亮码记录', hideTabBar: true }
  },
  {
    path: '/outlets',
    name: 'Outlets',
    component: () => import('../views/Outlets.vue'),
    meta: { title: '就近办' }
  },
  {
    path: '/outlets/:id',
    name: 'OutletDetail',
    component: () => import('../views/OutletDetail.vue'),
    meta: { title: '网点详情', hideTabBar: true }
  },
  {
    path: '/outlets/map',
    name: 'OutletMap',
    component: () => import('../views/OutletMap.vue'),
    meta: { title: '网点地图', hideTabBar: true }
  },
  {
    path: '/outlets/appointment',
    name: 'Appointment',
    component: () => import('../views/Appointment.vue'),
    meta: { title: '预约办理', hideTabBar: true }
  },
  {
    path: '/outlets/appointment/success',
    name: 'AppointmentSuccess',
    component: () => import('../views/AppointmentSuccess.vue'),
    meta: { title: '预约成功', hideTabBar: true }
  },
  {
    path: '/outlets/smart-match',
    name: 'SmartMatch',
    component: () => import('../views/SmartMatch.vue'),
    meta: { title: '智能匹配', hideTabBar: true }
  },
  {
    path: '/outlets/ar-nav',
    name: 'ARNavigation',
    component: () => import('../views/ARNavigation.vue'),
    meta: { title: 'AR实景导航', hideTabBar: true }
  },
  {
    path: '/elder',
    name: 'Elder',
    component: () => import('../views/Elder.vue'),
    meta: { title: '暖心办' }
  },
  {
    path: '/elder/home',
    name: 'ElderHome',
    component: () => import('../views/ElderHome.vue'),
    meta: { title: '长辈版首页' }
  },
  {
    path: '/elder/agent',
    name: 'AgentAuth',
    component: () => import('../views/AgentAuth.vue'),
    meta: { title: '亲友代办' }
  },
  {
    path: '/elder/agent/create',
    name: 'AgentCreate',
    component: () => import('../views/AgentCreate.vue'),
    meta: { title: '创建授权', hideTabBar: true }
  },
  {
    path: '/elder/agent/operations',
    name: 'AgentOperations',
    component: () => import('../views/AgentOperations.vue'),
    meta: { title: '代办记录', hideTabBar: true }
  },
  {
    path: '/elder/agent/confirm',
    name: 'AgentConfirm',
    component: () => import('../views/AgentConfirm.vue'),
    meta: { title: '确认代办', hideTabBar: true }
  },
  {
    path: '/elder/service',
    name: 'CustomerService',
    component: () => import('../views/CustomerService.vue'),
    meta: { title: '人工坐席', hideTabBar: true }
  },
  {
    path: '/elder/voice',
    name: 'VoiceInput',
    component: () => import('../views/VoiceInput.vue'),
    meta: { title: '语音输入', hideTabBar: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '我的' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { title: '后台工作台' }
  },
  {
    path: '/admin/heat',
    name: 'HeatPrediction',
    component: () => import('../views/HeatPrediction.vue'),
    meta: { title: '热度预测', hideTabBar: true }
  },
  {
    path: '/admin/windows',
    name: 'WindowScheduling',
    component: () => import('../views/WindowScheduling.vue'),
    meta: { title: '窗口调度', hideTabBar: true }
  },
  {
    path: '/admin/logs',
    name: 'OperationLogs',
    component: () => import('../views/OperationLogs.vue'),
    meta: { title: '审计日志', hideTabBar: true }
  },
  {
    path: '/admin/report',
    name: 'DataReport',
    component: () => import('../views/DataReport.vue'),
    meta: { title: '数据报表', hideTabBar: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || '渝快办'
  next()
})

export default router
