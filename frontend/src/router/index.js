import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/excerpt'
  },
  {
    path: '/excerpt',
    name: 'Excerpt',
    component: () => import('@/views/excerpt/index.vue'),
    meta: { title: '摘录' }
  },
  {
    path: '/excerpt/settings',
    name: 'ExcerptSettings',
    component: () => import('@/views/excerpt/Settings.vue'),
    meta: { title: '摘录设置' }
  },
  {
    path: '/poem/:id',
    name: 'PoemDetail',
    component: () => import('@/views/poem/Detail.vue'),
    meta: { title: '诗词详情' }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/community/index.vue'),
    meta: { title: '创作社区' }
  },
  {
    path: '/community/channels',
    name: 'ChannelSettings',
    component: () => import('@/views/community/Channels.vue'),
    meta: { title: '频道管理' }
  },
  {
    path: '/community/post/create',
    name: 'CreatePost',
    component: () => import('@/views/community/CreatePost.vue'),
    meta: { title: '发布', requiresAuth: true }
  },
  {
    path: '/community/post/:id',
    name: 'PostDetail',
    component: () => import('@/views/community/PostDetail.vue'),
    meta: { title: '帖子详情' }
  },
  {
    path: '/share',
    name: 'Share',
    component: () => import('@/views/share/index.vue'),
    meta: { title: '分享' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/user/Profile.vue'),
    meta: { title: '我的' }
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: () => import('@/views/user/EditProfile.vue'),
    meta: { title: '编辑资料', requiresAuth: true }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/user/Favorites.vue'),
    meta: { title: '我的收藏', requiresAuth: true }
  },
  {
    path: '/following',
    name: 'Following',
    component: () => import('@/views/user/Following.vue'),
    meta: { title: '我的关注', requiresAuth: true }
  },
  {
    path: '/followers',
    name: 'Followers',
    component: () => import('@/views/user/Followers.vue'),
    meta: { title: '我的粉丝', requiresAuth: true }
  },
  {
    path: '/user/:id',
    name: 'UserHome',
    component: () => import('@/views/user/UserHome.vue'),
    meta: { title: '用户主页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/auth/Privacy.vue'),
    meta: { title: '隐私政策' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn()) {
    next('/login')
  } else {
    next()
  }
})

export default router
