import { createRouter, createWebHistory } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { getToken } from '@/utils/auth'

NProgress.configure({ showSpinner: false })

const Layout = () => import('@/layout/index.vue')
const Login = () => import('@/views/login/index.vue')
const Dashboard = () => import('@/views/dashboard/index.vue')
const NotFound = () => import('@/views/error/404.vue')

const routes = [
  {
    path: '/login',
    component: Login,
    hidden: true,
    meta: { title: '登录' }
  },
  {
    path: '/404',
    component: NotFound,
    hidden: true,
    meta: { title: '404' }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '工作台', icon: 'HomeFilled', affix: true }
      }
    ]
  },
  {
    path: '/org',
    component: Layout,
    redirect: '/org/user-manage',
    name: 'Org',
    meta: { title: '组织管理', icon: 'OfficeBuilding' },
    children: [
      {
        path: 'user-manage',
        name: 'UserManage',
        component: Dashboard,
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'role-manage',
        name: 'RoleManage',
        component: Dashboard,
        meta: { title: '角色管理', icon: 'UserFilled' }
      }
    ]
  },
  {
    path: '/product',
    component: Layout,
    redirect: '/product/list',
    name: 'Product',
    meta: { title: '商品管理', icon: 'Goods' },
    children: [
      {
        path: 'list',
        name: 'ProductList',
        component: Dashboard,
        meta: { title: '商品列表', icon: 'List' }
      }
    ]
  },
  {
    path: '/inventory',
    component: Layout,
    redirect: '/inventory/query',
    name: 'Inventory',
    meta: { title: '库存管理', icon: 'Box' },
    children: [
      {
        path: 'query',
        name: 'StockQuery',
        component: Dashboard,
        meta: { title: '库存查询', icon: 'Search' }
      }
    ]
  },
  {
    path: '/allocation',
    component: Layout,
    redirect: '/allocation/req',
    name: 'Allocation',
    meta: { title: '调拨管理', icon: 'Transfer' },
    children: [
      {
        path: 'req',
        name: 'AllocationReq',
        component: Dashboard,
        meta: { title: '调拨申请', icon: 'Plus' }
      },
      {
        path: 'audit',
        name: 'AllocationAudit',
        component: Dashboard,
        meta: { title: '调拨审核', icon: 'CircleCheck' }
      }
    ]
  },
  {
    path: '/report',
    component: Layout,
    redirect: '/report/sales',
    name: 'Report',
    meta: { title: '报表分析', icon: 'DataLine' },
    children: [
      {
        path: 'sales',
        name: 'SalesReport',
        component: Dashboard,
        meta: { title: '销售报表', icon: 'TrendCharts' }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/dict',
    name: 'System',
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      {
        path: 'dict',
        name: 'DictManage',
        component: Dashboard,
        meta: { title: '字典管理', icon: 'Collection' }
      },
      {
        path: 'log',
        name: 'LogManage',
        component: Dashboard,
        meta: { title: '日志管理', icon: 'Document' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    hidden: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

const whiteList = ['/login', '/404']

router.beforeEach((to, from, next) => {
  NProgress.start()
  
  const token = getToken()
  
  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export function resetRouter() {
  const newRouter = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 })
  })
  router.matcher = newRouter.matcher
}

export default router
