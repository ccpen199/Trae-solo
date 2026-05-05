import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页', tabbar: true }
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import('@/views/Category.vue'),
    meta: { title: '分类', tabbar: true }
  },
  {
    path: '/discover',
    name: 'Discover',
    component: () => import('@/views/Discover.vue'),
    meta: { title: '发现', tabbar: true }
  },
  {
    path: '/store',
    name: 'Store',
    component: () => import('@/views/Store.vue'),
    meta: { title: '门店', tabbar: true }
  },
  {
    path: '/my',
    name: 'My',
    component: () => import('@/views/My.vue'),
    meta: { title: '我的', tabbar: true, requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/store/:id',
    name: 'StoreDetail',
    component: () => import('@/views/StoreDetail.vue'),
    meta: { title: '门店详情' }
  },
  {
    path: '/article/:id',
    name: 'ArticleDetail',
    component: () => import('@/views/ArticleDetail.vue'),
    meta: { title: '文章详情' }
  },
  {
    path: '/car-select',
    name: 'CarSelect',
    component: () => import('@/views/CarSelect.vue'),
    meta: { title: '选择车型' }
  },
  {
    path: '/my-cars',
    name: 'MyCars',
    component: () => import('@/views/MyCars.vue'),
    meta: { title: '我的车辆', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  document.title = to.meta.title ? `${to.meta.title} - 汽车养护` : '汽车养护'
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  next()
})

export default router
