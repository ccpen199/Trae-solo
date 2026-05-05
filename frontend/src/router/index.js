import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/packages',
    name: 'PackageList',
    component: () => import('@/views/PackageList.vue'),
    meta: { title: '套餐列表' }
  },
  {
    path: '/packages/:id',
    name: 'PackageDetail',
    component: () => import('@/views/PackageDetail.vue'),
    meta: { title: '套餐详情' }
  },
  {
    path: '/user',
    name: 'UserCenter',
    redirect: '/user/profile',
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/user/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: { title: '个人信息', requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart.vue'),
    meta: { title: '购物车', requiresAuth: true }
  },
  {
    path: '/accessories',
    name: 'AccessoryList',
    component: () => import('@/views/AccessoryList.vue'),
    meta: { title: '配件选择' }
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('@/views/OrderList.vue'),
    meta: { title: '我的订单', requiresAuth: true }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  {
    path: '/contract/:orderId',
    name: 'Contract',
    component: () => import('@/views/Contract.vue'),
    meta: { title: '合同打印', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 标准化套餐系统` : '标准化套餐系统'
  
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  if (to.meta.guest && userStore.isLoggedIn) {
    next({ path: '/' })
    return
  }
  
  next()
})

export default router
