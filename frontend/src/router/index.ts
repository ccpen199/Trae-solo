import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Role } from '@/types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册', requiresAuth: false },
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
        meta: { title: '工作台', icon: 'DataAnalysis' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/order/list.vue'),
        meta: { title: '订单列表', icon: 'Document' },
      },
      {
        path: 'orders/create',
        name: 'OrderCreate',
        component: () => import('@/views/order/create.vue'),
        meta: { title: '创建订单', icon: 'Plus', roles: [Role.BUYER] },
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/detail.vue'),
        meta: { title: '订单详情', icon: 'View' },
      },
      {
        path: 'suborders',
        name: 'SubOrders',
        component: () => import('@/views/suborder/list.vue'),
        meta: { title: '子订单管理', icon: 'List', roles: [Role.FARMER, Role.OPERATOR] },
      },
      {
        path: 'cold-chain',
        name: 'ColdChain',
        component: () => import('@/views/cold-chain/index.vue'),
        meta: { title: '冷链监控', icon: 'Monitor' },
      },
      {
        path: 'account',
        name: 'Account',
        component: () => import('@/views/account/index.vue'),
        meta: { title: '账户中心', icon: 'User' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  
  try {
    userStore.initFromStorage()
  } catch (e) {
    console.log('Storage initialization skipped:', e)
  }

  document.title = to.meta.title ? `${to.meta.title} - 农产品直采平台` : '农产品直采平台'

  if (to.meta.requiresAuth === false) {
    next()
    return
  }

  next()
})

export default router
