import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' }
      },
      {
        path: 'order',
        name: 'Order',
        meta: { title: '订单管理', icon: 'List' },
        children: [
          {
            path: 'list',
            name: 'OrderList',
            component: () => import('@/views/order/list.vue'),
            meta: { title: '订单列表' }
          },
          {
            path: 'detail/:id',
            name: 'OrderDetail',
            component: () => import('@/views/order/detail.vue'),
            meta: { title: '订单详情', hidden: true }
          }
        ]
      },
      {
        path: 'after-sale',
        name: 'AfterSale',
        meta: { title: '售后管理', icon: 'WarningFilled' },
        children: [
          {
            path: 'list',
            name: 'AfterSaleList',
            component: () => import('@/views/after-sale/list.vue'),
            meta: { title: '售后列表' }
          },
          {
            path: 'detail/:id',
            name: 'AfterSaleDetail',
            component: () => import('@/views/after-sale/detail.vue'),
            meta: { title: '售后详情', hidden: true }
          }
        ]
      },
      {
        path: 'platform',
        name: 'Platform',
        meta: { title: '平台授权', icon: 'Connection' },
        children: [
          {
            path: 'auth',
            name: 'PlatformAuth',
            component: () => import('@/views/platform/auth.vue'),
            meta: { title: '授权管理' }
          }
        ]
      },
      {
        path: 'goods',
        name: 'Goods',
        meta: { title: '菜品管理', icon: 'Food' },
        children: [
          {
            path: 'mapping',
            name: 'GoodsMapping',
            component: () => import('@/views/goods/mapping.vue'),
            meta: { title: '菜品映射' }
          },
          {
            path: 'list',
            name: 'GoodsList',
            component: () => import('@/views/goods/list.vue'),
            meta: { title: '菜品列表' }
          }
        ]
      },
      {
        path: 'print',
        name: 'Print',
        meta: { title: '打印管理', icon: 'Printer' },
        children: [
          {
            path: 'setting',
            name: 'PrintSetting',
            component: () => import('@/views/print/setting.vue'),
            meta: { title: '打印设置' }
          },
          {
            path: 'history',
            name: 'PrintHistory',
            component: () => import('@/views/print/history.vue'),
            meta: { title: '打印记录' }
          }
        ]
      },
      {
        path: 'statistics',
        name: 'Statistics',
        meta: { title: '营业统计', icon: 'DataLine' },
        children: [
          {
            path: 'overview',
            name: 'StatisticsOverview',
            component: () => import('@/views/statistics/overview.vue'),
            meta: { title: '统计概览' }
          },
          {
            path: 'daily',
            name: 'StatisticsDaily',
            component: () => import('@/views/statistics/daily.vue'),
            meta: { title: '日报表' }
          },
          {
            path: 'goods-sales',
            name: 'StatisticsGoodsSales',
            component: () => import('@/views/statistics/goods-sales.vue'),
            meta: { title: '菜品销量' }
          }
        ]
      },
      {
        path: 'audit',
        name: 'Audit',
        meta: { title: '审计日志', icon: 'Document' },
        children: [
          {
            path: 'trace',
            name: 'AuditTrace',
            component: () => import('@/views/audit/trace.vue'),
            meta: { title: '流程追踪' }
          },
          {
            path: 'list',
            name: 'AuditList',
            component: () => import('@/views/audit/list.vue'),
            meta: { title: '日志列表' }
          }
        ]
      },
      {
        path: 'setting',
        name: 'Setting',
        meta: { title: '系统设置', icon: 'Setting' },
        children: [
          {
            path: 'store',
            name: 'SettingStore',
            component: () => import('@/views/setting/store.vue'),
            meta: { title: '店铺设置' }
          },
          {
            path: 'account',
            name: 'SettingAccount',
            component: () => import('@/views/setting/account.vue'),
            meta: { title: '账号设置' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 外卖聚合接单系统` : '外卖聚合接单系统'
  
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false
  
  if (requiresAuth && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.path === '/login' && userStore.isLoggedIn) {
    next({ path: '/dashboard' })
    return
  }
  
  next()
})

export default router
