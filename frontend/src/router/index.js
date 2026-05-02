import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '看板' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/OrderList.vue'),
        meta: { title: '订单列表' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/OrderDetail.vue'),
        meta: { title: '订单详情' }
      },
      {
        path: 'entry',
        name: 'Entry',
        component: () => import('@/views/EntryForm.vue'),
        meta: { title: '车牌入场' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { title: '报表' }
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/Exceptions.vue'),
        meta: { title: '异常队列' }
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
  
  if (to.meta.requiresAuth !== false && !token) {
    ElMessage.warning('请先登录')
    next('/login')
  } else {
    next()
  }
})

export default router