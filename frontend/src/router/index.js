import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/home/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/group-classes',
    name: 'GroupClasses',
    component: () => import('../views/group/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/group-class/:id',
    name: 'GroupClassDetail',
    component: () => import('../views/group/detail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/coaches',
    name: 'Coaches',
    component: () => import('../views/coach/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/coach/:id',
    name: 'CoachDetail',
    component: () => import('../views/coach/detail.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/cards',
    name: 'Cards',
    component: () => import('../views/card/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/my',
    name: 'My',
    component: () => import('../views/my/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/profile',
    name: 'Profile',
    component: () => import('../views/my/profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/bookings',
    name: 'MyBookings',
    component: () => import('../views/my/bookings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/cards',
    name: 'MyCards',
    component: () => import('../views/my/cards.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/stores',
    name: 'Stores',
    component: () => import('../views/store/index.vue'),
    meta: { requiresAuth: false }
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('fitlife_token');
  
  if (to.meta.requiresAuth && !token) {
    next('/login');
  } else if (to.path === '/login' && token) {
    next('/home');
  } else {
    next();
  }
});

export default router;
