import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'

NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true, noAuth: true }
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { title: '首页', icon: 'HomeFilled' },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '数据大屏', icon: 'DataAnalysis', affix: true }
      }
    ]
  },
  {
    path: '/citizens',
    component: () => import('@/layout/index.vue'),
    redirect: '/citizens/list',
    meta: { title: '市民管理', icon: 'User' },
    children: [
      {
        path: 'list',
        name: 'CitizenList',
        component: () => import('@/views/citizens/list.vue'),
        meta: { title: '市民画像', icon: 'Avatar' }
      },
      {
        path: 'tags',
        name: 'CitizenTags',
        component: () => import('@/views/citizens/tags.vue'),
        meta: { title: '标签体系', icon: 'PriceTag' }
      },
      {
        path: 'behavior',
        name: 'BehaviorAnalytics',
        component: () => import('@/views/citizens/behavior.vue'),
        meta: { title: '行为分析', icon: 'Histogram' }
      }
    ]
  },
  {
    path: '/services',
    component: () => import('@/layout/index.vue'),
    redirect: '/services/list',
    meta: { title: '服务管理', icon: 'Service' },
    children: [
      {
        path: 'list',
        name: 'ServiceList',
        component: () => import('@/views/services/list.vue'),
        meta: { title: '办事服务', icon: 'Files' }
      },
      {
        path: 'orchestration',
        name: 'ServiceOrchestration',
        component: () => import('@/views/services/orchestration.vue'),
        meta: { title: '一件事编排', icon: 'Connection' }
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('@/views/services/departments.vue'),
        meta: { title: '委办局接入', icon: 'OfficeBuilding' }
      }
    ]
  },
  {
    path: '/knowledge',
    component: () => import('@/layout/index.vue'),
    redirect: '/knowledge/policies',
    meta: { title: '知识图谱', icon: 'Reading' },
    children: [
      {
        path: 'policies',
        name: 'Policies',
        component: () => import('@/views/knowledge/policies.vue'),
        meta: { title: '政策管理', icon: 'Document' }
      },
      {
        path: 'qa',
        name: 'KnowledgeQA',
        component: () => import('@/views/knowledge/qa.vue'),
        meta: { title: '问答库', icon: 'ChatDotRound' }
      },
      {
        path: 'graph',
        name: 'KnowledgeGraph',
        component: () => import('@/views/knowledge/graph.vue'),
        meta: { title: '图谱可视化', icon: 'Share' }
      }
    ]
  },
  {
    path: '/feedback',
    component: () => import('@/layout/index.vue'),
    redirect: '/feedback/workorders',
    meta: { title: '反馈闭环', icon: 'ChatLineSquare' },
    children: [
      {
        path: 'workorders',
        name: 'WorkOrders',
        component: () => import('@/views/feedback/workorders.vue'),
        meta: { title: '督办工单', icon: 'Tickets' }
      },
      {
        path: 'clusters',
        name: 'FeedbackClusters',
        component: () => import('@/views/feedback/clusters.vue'),
        meta: { title: '聚类分析', icon: 'TrendCharts' }
      },
      {
        path: 'analytics',
        name: 'FeedbackAnalytics',
        component: () => import('@/views/feedback/analytics.vue'),
        meta: { title: '满意度分析', icon: 'PieChart' }
      }
    ]
  },
  {
    path: '/offline',
    component: () => import('@/layout/index.vue'),
    redirect: '/offline/packages',
    meta: { title: '离线管理', icon: 'Download' },
    children: [
      {
        path: 'packages',
        name: 'OfflinePackages',
        component: () => import('@/views/offline/packages.vue'),
        meta: { title: '离线包管理', icon: 'Box' }
      },
      {
        path: 'certs',
        name: 'OfflineCerts',
        component: () => import('@/views/offline/certs.vue'),
        meta: { title: '离线证明监控', icon: 'Stamp' }
      }
    ]
  },
  {
    path: '/system',
    component: () => import('@/layout/index.vue'),
    redirect: '/system/logs',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'logs',
        name: 'SystemLogs',
        component: () => import('@/views/system/logs.vue'),
        meta: { title: '日志审计', icon: 'DocumentCopy' }
      },
      {
        path: 'health',
        name: 'HealthMonitor',
        component: () => import('@/views/system/health.vue'),
        meta: { title: '健康监控', icon: 'Monitor' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/placeholder/index.vue'),
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to, _from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || ''}${to.meta.title ? ' - ' : ''}郑州市掌上办事中枢管理后台`
  next()
})

router.afterEach(() => NProgress.done())

export default router
