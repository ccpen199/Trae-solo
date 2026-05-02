import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/Products.vue'),
        meta: { title: '商品目录', icon: 'Goods' }
      },
      {
        path: 'purchases',
        name: 'Purchases',
        component: () => import('@/views/Purchases.vue'),
        meta: { title: '采购申请', icon: 'Document' }
      },
      {
        path: 'purchases/create',
        name: 'PurchaseCreate',
        component: () => import('@/views/PurchaseCreate.vue'),
        meta: { title: '创建采购申请', hidden: true }
      },
      {
        path: 'purchases/:id',
        name: 'PurchaseDetail',
        component: () => import('@/views/PurchaseDetail.vue'),
        meta: { title: '采购申请详情', hidden: true }
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: () => import('@/views/Approvals.vue'),
        meta: { title: '审批管理', icon: 'Stamp' }
      },
      {
        path: 'budgets',
        name: 'Budgets',
        component: () => import('@/views/Budgets.vue'),
        meta: { title: '预算管理', icon: 'Wallet' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 采购商城系统` : '采购商城系统'
  
  const userStore = useUserStore()
  const token = localStorage.getItem('token')
  
  if (to.path === '/login') {
    if (token) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    if (token) {
      if (!userStore.userInfo) {
        try {
          await userStore.getUserInfo()
          next()
        } catch (error) {
          localStorage.removeItem('token')
          userStore.logout()
          next('/login')
        }
      } else {
        next()
      }
    } else {
      next('/login')
    }
  }
})

export default router
