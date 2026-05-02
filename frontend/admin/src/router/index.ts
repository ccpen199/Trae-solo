import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  WAITER = 'waiter',
  CHEF = 'chef',
  CUSTOMER = 'customer',
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    redirect: '/dashboard',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: {
          title: '仪表盘',
          icon: 'DataLine',
          roles: [UserRole.ADMIN, UserRole.MANAGER],
        },
      },
      {
        path: 'tables',
        name: 'Tables',
        component: () => import('@/views/tables/TablesView.vue'),
        meta: {
          title: '桌台管理',
          icon: 'OfficeBuilding',
          roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER],
        },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/orders/OrdersView.vue'),
        meta: {
          title: '订单管理',
          icon: 'List',
          roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER, UserRole.CHEF],
        },
      },
      {
        path: 'kitchen',
        name: 'Kitchen',
        component: () => import('@/views/kitchen/KitchenView.vue'),
        meta: {
          title: '后厨工作台',
          icon: 'KnifeFork',
          roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CHEF],
        },
      },
      {
        path: 'pos',
        name: 'POS',
        component: () => import('@/views/pos/POSView.vue'),
        meta: {
          title: '收银台',
          icon: 'Money',
          roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        },
      },
      {
        path: 'menu',
        name: 'Menu',
        component: () => import('@/views/menu/MenuView.vue'),
        meta: {
          title: '菜单管理',
          icon: 'Grid',
          roles: [UserRole.ADMIN, UserRole.MANAGER],
        },
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/members/MembersView.vue'),
        meta: {
          title: '会员管理',
          icon: 'User',
          roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER],
        },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/ReportsView.vue'),
        meta: {
          title: '报表中心',
          icon: 'Document',
          roles: [UserRole.ADMIN, UserRole.MANAGER],
        },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UsersView.vue'),
        meta: {
          title: '员工管理',
          icon: 'UserFilled',
          roles: [UserRole.ADMIN, UserRole.MANAGER],
        },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: {
          title: '系统设置',
          icon: 'Setting',
          roles: [UserRole.ADMIN],
        },
      },
    ],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
