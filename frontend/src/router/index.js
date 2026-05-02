import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store'

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
    component: () => import('@/views/Login.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/Home.vue'),
    meta: { title: '商品列表' }
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/ProductDetail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/publish',
    name: 'Publish',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '发布商品', requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('@/views/Orders.vue'),
    meta: { title: '我的订单', requiresAuth: true }
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue'),
    meta: { title: '订单详情', requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '消息', requiresAuth: true }
  },
  {
    path: '/chat/:productId',
    name: 'ChatSession',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '聊天', requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '我的收藏', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/my-products',
    name: 'MyProducts',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '我的商品', requiresAuth: true, requiresSeller: true }
  },
  {
    path: '/disputes',
    name: 'Disputes',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '纠纷管理', requiresAuth: true }
  },
  {
    path: '/disputes/:id',
    name: 'DisputeDetail',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '纠纷详情', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/reviews',
    name: 'AdminReviews',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '商品审核', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/disputes',
    name: 'AdminDisputes',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '纠纷处理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/audit',
    name: 'AdminAudit',
    component: () => import('@/views/SimplePage.vue'),
    meta: { title: '审计日志', requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  const token = localStorage.getItem('token')

  document.title = to.meta.title ? `${to.meta.title} - C2C二手交易平台` : 'C2C二手交易平台'

  if (to.meta.requiresAuth || to.meta.requiresAdmin || to.meta.requiresSeller) {
    if (!token && !userStore.isLoggedIn) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }

    if (token && !userStore.userInfo) {
      try {
        await userStore.fetchUserInfo()
      } catch (e) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    }

    if (to.meta.requiresAdmin) {
      if (!userStore.isAdmin && !userStore.isCustomerService) {
        next({ name: 'Home' })
        return
      }
    }

    if (to.meta.requiresSeller) {
      if (!userStore.isSeller && !userStore.isAdmin) {
        next({ name: 'Home' })
        return
      }
    }
  }

  if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'Home' })
    return
  }

  next()
})

export default router
