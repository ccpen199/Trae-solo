import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '运营总览' } },
      { path: 'appointment', component: () => import('../views/Appointment.vue'), meta: { title: '访客预约' } },
      { path: 'appointments', component: () => import('../views/Appointments.vue'), meta: { title: '预约管理' } },
      { path: 'review', component: () => import('../views/Review.vue'), meta: { title: '预约审核' } },
      { path: 'checkin', component: () => import('../views/Checkin.vue'), meta: { title: '入园核验' } },
      { path: 'parking', component: () => import('../views/Parking.vue'), meta: { title: '车辆管理' } },
      { path: 'checkout', component: () => import('../views/Checkout.vue'), meta: { title: '离园确认' } },
      { path: 'visitors', component: () => import('../views/Visitors.vue'), meta: { title: '访客管理' } },
      { path: 'logs', component: () => import('../views/Logs.vue'), meta: { title: '操作日志' } }
    ]
  },
  { path: '/login', component: () => import('../views/Login.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
