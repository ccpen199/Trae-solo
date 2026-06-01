import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/residents',
    component: () => import('../views/Residents.vue'),
    meta: { title: '居民档案管理' }
  },
  {
    path: '/rules',
    component: () => import('../views/Rules.vue'),
    meta: { title: '积分规则配置' }
  },
  {
    path: '/activities',
    component: () => import('../views/Activities.vue'),
    meta: { title: '活动管理' }
  },
  {
    path: '/exchange',
    component: () => import('../views/Exchange.vue'),
    meta: { title: '积分兑换' }
  },
  {
    path: '/ranking',
    component: () => import('../views/Ranking.vue'),
    meta: { title: '积分排行公示' }
  },
  {
    path: '/appeals',
    component: () => import('../views/Appeals.vue'),
    meta: { title: '申诉处理' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
