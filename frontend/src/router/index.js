import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '成本看板', icon: 'dashboard' }
      },
      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/Bills.vue'),
        meta: { title: '资源账单', icon: 'bill' }
      },
      {
        path: 'resources/unassigned',
        name: 'UnassignedResources',
        component: () => import('@/views/UnassignedResources.vue'),
        meta: { title: '待认领资源', icon: 'resource' }
      },
      {
        path: 'optimization',
        name: 'Optimization',
        component: () => import('@/views/Optimization.vue'),
        meta: { title: '优化建议', icon: 'optimization' }
      },
      {
        path: 'workorders',
        name: 'WorkOrders',
        component: () => import('@/views/WorkOrders.vue'),
        meta: { title: '执行工单', icon: 'workorder' }
      },
      {
        path: 'workorders/:id',
        name: 'WorkOrderDetail',
        component: () => import('@/views/WorkOrderDetail.vue'),
        meta: { title: '工单详情', icon: 'workorder' }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/Finance.vue'),
        meta: { title: '财务报表', icon: 'finance' }
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/Projects.vue'),
        meta: { title: '项目管理', icon: 'project' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || 'FinOps'} - 云资源成本优化管理系统`
  next()
})

export default router
