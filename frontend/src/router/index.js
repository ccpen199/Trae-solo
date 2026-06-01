import { createRouter, createWebHashHistory } from 'vue-router'
import Layout from '../components/Layout.vue'

const routes = [
  { path: '/login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: Layout,
    redirect: '/portal',
    children: [
      { path: 'portal', name: 'portal', component: () => import('../views/Portal.vue'), meta: { title: '工作台首页' } },
      { path: 'app-catalog', name: 'app-catalog', component: () => import('../views/AppCatalog.vue'), meta: { title: '应用目录' } },
      { path: 'permission-apply', name: 'permission-apply', component: () => import('../views/PermissionApply.vue'), meta: { title: '权限申请' } },
      { path: 'my-permissions', name: 'my-permissions', component: () => import('../views/MyPermissions.vue'), meta: { title: '我的权限' } },
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '总览看板' } },
      { path: 'applications', name: 'applications', component: () => import('../views/Applications.vue'), meta: { title: '应用管理' } },
      { path: 'applications/:id', name: 'application-detail', component: () => import('../views/ApplicationDetail.vue'), meta: { title: '应用详情' } },
      { path: 'configs', name: 'configs', component: () => import('../views/Configs.vue'), meta: { title: '配置中心' } },
      { path: 'tasks', name: 'tasks', component: () => import('../views/Tasks.vue'), meta: { title: '执行任务' } },
      { path: 'tasks/:id', name: 'task-detail', component: () => import('../views/TaskDetail.vue'), meta: { title: '任务详情' } },
      { path: 'logs', name: 'logs', component: () => import('../views/Logs.vue'), meta: { title: '调用日志' } },
      { path: 'change-orders', name: 'change-orders', component: () => import('../views/ChangeOrders.vue'), meta: { title: '变更单' } },
      { path: 'change-orders/:id', name: 'change-order-detail', component: () => import('../views/ChangeOrderDetail.vue'), meta: { title: '变更详情' } },
      { path: 'alerts', name: 'alerts', component: () => import('../views/Alerts.vue'), meta: { title: '告警中心' } },
      { path: 'audits', name: 'audits', component: () => import('../views/Audits.vue'), meta: { title: '权限审计' } },
      { path: 'review-center', name: 'review-center', component: () => import('../views/ReviewCenter.vue'), meta: { title: '复核中心' } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/portal' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path === '/login') return next()
  if (!token) return next('/login')
  next()
})

export default router
