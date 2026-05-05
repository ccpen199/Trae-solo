import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'pos',
        name: 'POS',
        component: () => import('@/views/POS.vue'),
        meta: { title: '前台收银', permission: 'order:write' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '订单管理', permission: 'order:read' }
      },
      {
        path: 'dishes',
        name: 'Dishes',
        component: () => import('@/views/Dishes.vue'),
        meta: { title: '菜品管理', permission: 'dish:read' }
      },
      {
        path: 'tables',
        name: 'Tables',
        component: () => import('@/views/Tables.vue'),
        meta: { title: '桌台管理', permission: 'table:read' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/Inventory.vue'),
        meta: { title: '库存管理', permission: 'inventory:read' }
      },
      {
        path: 'payments',
        name: 'Payments',
        component: () => import('@/views/Payments.vue'),
        meta: { title: '收银记录', permission: 'payment:read' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', permission: 'user:read' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { title: '营业报表', permission: 'report:read' }
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
  
  document.title = to.meta.title ? `${to.meta.title} - 餐饮管理系统` : '餐饮管理系统'
  
  if (to.meta.guest) {
    if (userStore.isLoggedIn) {
      next({ path: '/dashboard' })
    } else {
      next()
    }
    return
  }
  
  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (!userStore.user) {
    try {
      await userStore.getCurrentUser()
    } catch (e) {
      next({ path: '/login' })
      return
    }
  }
  
  if (to.meta.permission) {
    if (!userStore.hasPermission(to.meta.permission)) {
      next({ path: '/dashboard' })
      return
    }
  }
  
  next()
})

export default router
