import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/Index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/role/Index.vue'),
        meta: { title: '角色管理', icon: 'UserFilled' }
      },
      {
        path: 'organizations',
        name: 'Organizations',
        component: () => import('@/views/organization/Index.vue'),
        meta: { title: '组织管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/log/Index.vue'),
        meta: { title: '操作日志', icon: 'Document' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  userStore.initFromStorage()
  
  document.title = to.meta.title ? `${to.meta.title} - 权限管理系统` : '权限管理系统'
  
  if (to.meta.requiresAuth === false) {
    if (to.path === '/login' && userStore.isLoggedIn) {
      next('/')
    } else {
      next()
    }
    return
  }
  
  if (!userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch (err) {
      userStore.logout()
      next('/login')
      return
    }
  }
  
  next()
})

export default router
