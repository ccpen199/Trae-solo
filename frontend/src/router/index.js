import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../views/Layout.vue'
import { useUserStore } from '../stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { title: '登录', requiresAuth: false }
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/Dashboard.vue'),
          meta: { title: '数据概览' }
        },
        {
          path: 'projects',
          name: 'Projects',
          component: () => import('../views/Projects.vue'),
          meta: { title: '资金项目管理' }
        },
        {
          path: 'applications',
          name: 'Applications',
          component: () => import('../views/Applications.vue'),
          meta: { title: '拨付申请管理' }
        },
        {
          path: 'applications/new',
          name: 'NewApplication',
          component: () => import('../views/NewApplication.vue'),
          meta: { title: '新建拨付申请' }
        },
        {
          path: 'applications/:id',
          name: 'ApplicationDetail',
          component: () => import('../views/ApplicationDetail.vue'),
          meta: { title: '申请详情' }
        },
        {
          path: 'audit',
          name: 'Audit',
          component: () => import('../views/Audit.vue'),
          meta: { title: '审核工作台' }
        },
        {
          path: 'payment',
          name: 'Payment',
          component: () => import('../views/Payment.vue'),
          meta: { title: '支付管理' }
        },
        {
          path: 'performance',
          name: 'Performance',
          component: () => import('../views/Performance.vue'),
          meta: { title: '绩效跟踪' }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const { isLoggedIn } = useUserStore()
  
  if (to.meta.requiresAuth !== false && !isLoggedIn.value) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn.value) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
