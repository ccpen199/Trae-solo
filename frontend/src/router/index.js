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
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人信息' }
      },
      {
        path: 'customers',
        name: 'CustomerList',
        component: () => import('@/views/customers/List.vue'),
        meta: { title: '客户管理', roles: ['super_admin', 'sales'] }
      },
      {
        path: 'customers/:id',
        name: 'CustomerDetail',
        component: () => import('@/views/customers/List.vue'),
        meta: { title: '客户详情', roles: ['super_admin', 'sales'] }
      },
      {
        path: 'orders',
        name: 'OrderList',
        component: () => import('@/views/orders/List.vue'),
        meta: { title: '订单管理' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/List.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'orders-create',
        name: 'OrderCreate',
        component: () => import('@/views/orders/Create.vue'),
        meta: { title: '创建订单', roles: ['super_admin', 'sales'] }
      },
      {
        path: 'pending-shipment',
        name: 'PendingShipment',
        component: () => import('@/views/warehouse/PendingShipment.vue'),
        meta: { title: '待发货订单', roles: ['super_admin', 'warehouse'] }
      },
      {
        path: 'products',
        name: 'ProductList',
        component: () => import('@/views/products/List.vue'),
        meta: { title: '产品管理', roles: ['super_admin', 'warehouse'] }
      },
      {
        path: 'inventory',
        name: 'InventoryList',
        component: () => import('@/views/warehouse/Inventory.vue'),
        meta: { title: '库存管理', roles: ['super_admin', 'warehouse'] }
      },
      {
        path: 'stock-in',
        name: 'StockInList',
        component: () => import('@/views/warehouse/StockIn.vue'),
        meta: { title: '入库记录', roles: ['super_admin', 'warehouse'] }
      },
      {
        path: 'stock-out',
        name: 'StockOutList',
        component: () => import('@/views/warehouse/StockOut.vue'),
        meta: { title: '出库记录', roles: ['super_admin', 'warehouse'] }
      },
      {
        path: 'inventory-checks',
        name: 'InventoryChecks',
        component: () => import('@/views/warehouse/InventoryChecks.vue'),
        meta: { title: '库存盘点记录', roles: ['super_admin', 'warehouse'] }
      },
      {
        path: 'deposit-orders',
        name: 'DepositOrderList',
        component: () => import('@/views/deposit-orders/List.vue'),
        meta: { title: '定金单审核', roles: ['super_admin', 'finance'] }
      },
      {
        path: 'order-follow',
        name: 'OrderFollow',
        component: () => import('@/views/cs/OrderFollow.vue'),
        meta: { title: '订单跟进', roles: ['super_admin', 'customer_service'] }
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
  
  document.title = to.meta.title ? `${to.meta.title} - 销售仓储财务一体化后台` : '销售仓储财务一体化后台'
  
  if (!userStore.isLoggedIn && to.meta.requiresAuth !== false) {
    next('/login')
    return
  }
  
  if (to.meta.roles && to.meta.roles.length > 0) {
    const hasRole = to.meta.roles.includes(userStore.roleCode)
    if (!hasRole && userStore.roleCode !== 'super_admin') {
      next('/dashboard')
      return
    }
  }
  
  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
