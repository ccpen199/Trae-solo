import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/',
    redirect: '/square'
  },
  {
    path: '/square',
    name: 'Square',
    component: () => import('@/views/Square.vue'),
    meta: { title: '读书广场' }
  },
  {
    path: '/channels',
    name: 'Channels',
    component: () => import('@/views/Channels.vue'),
    meta: { title: '频道聚合' }
  },
  {
    path: '/channels/:id',
    name: 'ChannelDetail',
    component: () => import('@/views/ChannelDetail.vue'),
    meta: { title: '频道详情' }
  },
  {
    path: '/books',
    name: 'Books',
    component: () => import('@/views/Books.vue'),
    meta: { title: '书籍列表' }
  },
  {
    path: '/books/:id',
    name: 'BookDetail',
    component: () => import('@/views/BookDetail.vue'),
    meta: { title: '书籍详情' }
  },
  {
    path: '/libraries',
    name: 'Libraries',
    component: () => import('@/views/Libraries.vue'),
    meta: { title: '图书馆' }
  },
  {
    path: '/libraries/:id',
    name: 'LibraryDetail',
    component: () => import('@/views/LibraryDetail.vue'),
    meta: { title: '图书馆详情' }
  },
  {
    path: '/comments/weibo',
    name: 'WeiboComments',
    component: () => import('@/views/WeiboComments.vue'),
    meta: { title: '微博评论' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: { title: '搜索' }
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
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 读书人频道` : '读书人频道';
  
  const userStore = useUserStore();
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    if (userStore.token) {
      await userStore.fetchProfile();
      if (userStore.isLoggedIn) {
        next();
      } else {
        next({ name: 'Login', query: { redirect: to.fullPath } });
      }
    } else {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    }
  } else if (to.meta.guest && userStore.isLoggedIn) {
    next({ name: 'Square' });
  } else {
    if (userStore.token && !userStore.isLoggedIn) {
      await userStore.fetchProfile().catch(() => {});
    }
    next();
  }
});

export default router;
