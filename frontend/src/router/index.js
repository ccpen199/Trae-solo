import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '首页仪表盘' }
  },
  {
    path: '/alarm-desk',
    name: 'AlarmDesk',
    component: () => import('../views/AlarmDesk.vue'),
    meta: { title: '接警台' }
  },
  {
    path: '/dispatch',
    name: 'Dispatch',
    component: () => import('../views/Dispatch.vue'),
    meta: { title: '派警调度' }
  },
  {
    path: '/scene',
    name: 'Scene',
    component: () => import('../views/Scene.vue'),
    meta: { title: '现场处置' }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/Reports.vue'),
    meta: { title: '复盘报表' }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/Resources.vue'),
    meta: { title: '资源管理' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 消防接处警系统` : '消防接处警系统'
  next()
})

export default router
