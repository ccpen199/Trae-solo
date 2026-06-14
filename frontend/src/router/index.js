import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/client/register',
    name: 'ClientRegister',
    component: () => import('@/views/ClientRegister.vue')
  },
  {
    path: '/courier/register',
    name: 'CourierRegister',
    component: () => import('@/views/CourierRegister.vue')
  },
  {
    path: '/tasks/create',
    name: 'CreateTask',
    component: () => import('@/views/CreateTask.vue')
  },
  {
    path: '/tasks',
    name: 'TaskList',
    component: () => import('@/views/TaskList.vue')
  },
  {
    path: '/tasks/:id',
    name: 'TaskDetail',
    component: () => import('@/views/TaskDetail.vue')
  },
  {
    path: '/courier/大厅',
    name: 'CourierLobby',
    component: () => import('@/views/CourierLobby.vue')
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/AdminDashboard.vue'),
    children: [
      {
        path: '',
        name: 'AdminStats',
        component: () => import('@/views/AdminStats.vue')
      },
      {
        path: 'zones',
        name: 'AdminZones',
        component: () => import('@/views/AdminZones.vue')
      },
      {
        path: 'restricted-items',
        name: 'AdminRestrictedItems',
        component: () => import('@/views/AdminRestrictedItems.vue')
      },
      {
        path: 'disputes',
        name: 'AdminDisputes',
        component: () => import('@/views/AdminDisputes.vue')
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('@/views/AdminAudit.vue')
      },
      {
        path: 'couriers',
        name: 'AdminCouriers',
        component: () => import('@/views/AdminCouriers.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userType = localStorage.getItem('userType')
  const publicPages = ['/login', '/client/register', '/courier/register']

  if (!token && !publicPages.includes(to.path)) {
    next('/login')
    return
  }

  if (token && to.path === '/login') {
    if (userType === 'admin') next('/admin')
    else next('/home')
    return
  }

  if (to.path.startsWith('/admin') && userType !== 'admin') {
    next('/login')
    return
  }

  next()
})

export default router
