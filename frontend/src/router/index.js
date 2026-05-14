import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '产品吧 - 商品内容社区' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/auth/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/bars',
    name: 'BarList',
    component: () => import('@/views/bars/BarList.vue'),
    meta: { title: '产品吧' }
  },
  {
    path: '/bars/create',
    name: 'CreateBar',
    component: () => import('@/views/bars/CreateBar.vue'),
    meta: { title: '创建产品吧', requiresAuth: true }
  },
  {
    path: '/bars/:id',
    name: 'BarDetail',
    component: () => import('@/views/bars/BarDetail.vue'),
    meta: { title: '产品吧详情' }
  },
  {
    path: '/posts/create/:barId',
    name: 'CreatePost',
    component: () => import('@/views/posts/CreatePost.vue'),
    meta: { title: '发布帖子', requiresAuth: true }
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: () => import('@/views/posts/PostDetail.vue'),
    meta: { title: '帖子详情' }
  },
  {
    path: '/products',
    name: 'ProductList',
    component: () => import('@/views/products/ProductList.vue'),
    meta: { title: '商品' }
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('@/views/products/ProductDetail.vue'),
    meta: { title: '商品详情' }
  },
  {
    path: '/taobao',
    name: 'TaobaoChannel',
    component: () => import('@/views/TaobaoChannel.vue'),
    meta: { title: '淘宝精选频道' }
  },
  {
    path: '/news',
    name: 'NewsList',
    component: () => import('@/views/content/ContentList.vue'),
    meta: { title: '资讯频道', contentType: 'news' }
  },
  {
    path: '/forum',
    name: 'ForumList',
    component: () => import('@/views/content/ContentList.vue'),
    meta: { title: '论坛社区', contentType: 'forum' }
  },
  {
    path: '/blog',
    name: 'BlogList',
    component: () => import('@/views/content/ContentList.vue'),
    meta: { title: '博客专栏', contentType: 'blog' }
  },
  {
    path: '/qa',
    name: 'QaList',
    component: () => import('@/views/content/ContentList.vue'),
    meta: { title: '问答专区', contentType: 'qa' }
  },
  {
    path: '/operator',
    name: 'Operator',
    component: () => import('@/views/operator/OperatorDashboard.vue'),
    meta: { title: '运营管理', requiresOperator: true },
    children: [
      {
        path: '',
        redirect: '/operator/stats'
      },
      {
        path: 'stats',
        name: 'OperatorStats',
        component: () => import('@/views/operator/Stats.vue'),
        meta: { title: '数据统计' }
      },
      {
        path: 'reviews',
        name: 'OperatorReviews',
        component: () => import('@/views/operator/Reviews.vue'),
        meta: { title: '内容审核' }
      },
      {
        path: 'reports',
        name: 'OperatorReports',
        component: () => import('@/views/operator/Reports.vue'),
        meta: { title: '举报处理' }
      },
      {
        path: 'blacklist',
        name: 'OperatorBlacklist',
        component: () => import('@/views/operator/Blacklist.vue'),
        meta: { title: '敏感词管理' }
      }
    ]
  },
  {
    path: '/my-bars',
    name: 'MyBars',
    component: () => import('@/views/bars/MyBars.vue'),
    meta: { title: '我的产品吧', requiresAuth: true }
  },
  {
    path: '/my-posts',
    name: 'MyPosts',
    component: () => import('@/views/posts/MyPosts.vue'),
    meta: { title: '我的帖子', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  if (!userStore.user && userStore.token) {
    userStore.restoreFromStorage()
  }

  if (to.meta.title) {
    document.title = to.meta.title
  }

  if (to.meta.guest && userStore.isLoggedIn) {
    return next('/')
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (to.meta.requiresOperator && !userStore.isOperator) {
    return next('/')
  }

  next()
})

export default router
