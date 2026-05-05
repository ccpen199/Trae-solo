import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProfileView from '../views/ProfileView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import ArticleDetailView from '../views/ArticleDetailView.vue'
import AlbumsView from '../views/AlbumsView.vue'
import AlbumDetailView from '../views/AlbumDetailView.vue'
import MediaView from '../views/MediaView.vue'
import GuestbookView from '../views/GuestbookView.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'
import { useStore } from '@/store'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录' }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: '个人信息' }
  },
  {
    path: '/articles',
    name: 'articles',
    component: ArticlesView,
    meta: { title: '日志' }
  },
  {
    path: '/articles/:id',
    name: 'article-detail',
    component: ArticleDetailView,
    meta: { title: '文章详情' }
  },
  {
    path: '/learning',
    name: 'learning',
    component: ArticlesView,
    meta: { title: '学习园地', category: 2 }
  },
  {
    path: '/albums',
    name: 'albums',
    component: AlbumsView,
    meta: { title: '相册' }
  },
  {
    path: '/albums/:id',
    name: 'album-detail',
    component: AlbumDetailView,
    meta: { title: '相册详情' }
  },
  {
    path: '/media',
    name: 'media',
    component: MediaView,
    meta: { title: '音乐影视' }
  },
  {
    path: '/guestbook',
    name: 'guestbook',
    component: GuestbookView,
    meta: { title: '留言板' }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { title: '后台管理', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 个人网站` : '个人网站'
  
  const { state } = useStore()
  
  if (to.meta.requiresAuth && !state.isLoggedIn) {
    next('/login')
    return
  }
  
  if (to.name === 'login' && state.isLoggedIn) {
    next('/admin')
    return
  }
  
  next()
})

export default router
