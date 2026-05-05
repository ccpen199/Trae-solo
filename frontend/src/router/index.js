import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' }
      },
      {
        path: 'organization',
        name: 'Organization',
        component: () => import('@/views/organization/index.vue'),
        meta: { title: '机构管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'role',
        name: 'Role',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色管理', icon: 'UserFilled' }
      },
      {
        path: 'schedule',
        name: 'Schedule',
        component: () => import('@/views/schedule/index.vue'),
        meta: { title: '日程管理', icon: 'Calendar' }
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  document.title = to.meta.title ? `${to.meta.title} - OA系统` : 'OA系统';

  if (to.path === '/login') {
    if (userStore.isLoggedIn) {
      next({ path: '/' });
    } else {
      next();
    }
    return;
  }

  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }

  if (!userStore.userInfo) {
    try {
      await userStore.getUserInfo();
    } catch (error) {
      await userStore.logout();
      next({ path: '/login' });
      return;
    }
  }

  next();
});

export default router;
