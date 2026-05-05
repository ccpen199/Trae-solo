import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Index.vue'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    component: Layout,
    redirect: '/home/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览' }
      }
    ]
  },
  {
    path: '/factory',
    component: Layout,
    meta: { title: '主机厂管理' },
    children: [
      {
        path: 'tasks',
        name: 'FactoryTasks',
        component: () => import('@/views/factory/TaskList.vue'),
        meta: { title: '内训任务管理' }
      },
      {
        path: 'tasks/create',
        name: 'CreateTask',
        component: () => import('@/views/factory/TaskForm.vue'),
        meta: { title: '新建A类内训任务' }
      },
      {
        path: 'tasks/edit/:id',
        name: 'EditTask',
        component: () => import('@/views/factory/TaskForm.vue'),
        meta: { title: '编辑内训任务' }
      },
      {
        path: 'audit',
        name: 'FactoryAudit',
        component: () => import('@/views/factory/AuditList.vue'),
        meta: { title: '内训审核管理' }
      },
      {
        path: 'audit/detail/:id',
        name: 'AuditDetail',
        component: () => import('@/views/factory/AuditDetail.vue'),
        meta: { title: '审核详情' }
      }
    ]
  },
  {
    path: '/dealer',
    component: Layout,
    meta: { title: '经销商管理' },
    children: [
      {
        path: 'execution',
        name: 'DealerExecution',
        component: () => import('@/views/dealer/ExecutionList.vue'),
        meta: { title: '内训执行列表' }
      },
      {
        path: 'execution/detail/:id',
        name: 'ExecutionDetail',
        component: () => import('@/views/dealer/ExecutionDetail.vue'),
        meta: { title: '执行详情' }
      },
      {
        path: 'tasks/create',
        name: 'CreateDealerTask',
        component: () => import('@/views/dealer/TaskForm.vue'),
        meta: { title: '新建B类内训任务' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 领克全球培训内训管理系统` : '领克全球培训内训管理系统'
  next()
})

export default router
