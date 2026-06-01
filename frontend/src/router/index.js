import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '数据概览' }
  },
  {
    path: '/meters',
    component: () => import('../views/Meters.vue'),
    meta: { title: '表计档案' }
  },
  {
    path: '/readings',
    component: () => import('../views/Readings.vue'),
    meta: { title: '抄表录入' }
  },
  {
    path: '/review',
    component: () => import('../views/Review.vue'),
    meta: { title: '异常复核' }
  },
  {
    path: '/rules',
    component: () => import('../views/Rules.vue'),
    meta: { title: '分摊规则' }
  },
  {
    path: '/bills',
    component: () => import('../views/Bills.vue'),
    meta: { title: '账单管理' }
  },
  {
    path: '/enterprises',
    component: () => import('../views/Enterprises.vue'),
    meta: { title: '企业管理' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
