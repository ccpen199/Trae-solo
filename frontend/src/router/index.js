import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/userStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录 - 船运订舱系统', public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' },
      },
      {
        path: 'bookings',
        name: 'BookingList',
        component: () => import('@/views/bookings/List.vue'),
        meta: { title: '订舱单列表' },
      },
      {
        path: 'bookings/create',
        name: 'BookingCreate',
        component: () => import('@/views/bookings/Create.vue'),
        meta: { title: '新建订舱单' },
      },
      {
        path: 'bookings/:id(\\d+)',
        name: 'BookingDetail',
        component: () => import('@/views/bookings/Detail.vue'),
        meta: { title: '订舱单详情' },
      },
      {
        path: 'schedules',
        name: 'ScheduleList',
        component: () => import('@/views/schedules/List.vue'),
        meta: { title: '船期管理' },
      },
      {
        path: 'containers',
        name: 'ContainerList',
        component: () => import('@/views/containers/Assign.vue'),
        meta: { title: '箱号分配' },
      },
      {
        path: 'port-entry',
        name: 'PortEntry',
        component: () => import('@/views/port/Entry.vue'),
        meta: { title: '港口进场' },
      },
      {
        path: 'loading',
        name: 'Loading',
        component: () => import('@/views/loading/List.vue'),
        meta: { title: '装船管理' },
      },
      {
        path: 'bills',
        name: 'Bills',
        component: () => import('@/views/bills/List.vue'),
        meta: { title: '提单放单' },
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/messages/List.vue'),
        meta: { title: '待办消息' },
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/exceptions/List.vue'),
        meta: { title: '异常处理' },
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/audit/List.vue'),
        meta: { title: '审计日志' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  document.title = to.meta?.title || '船运订舱系统'

  if (!userStore.isLoggedIn) {
    userStore.initUser()
  }

  if (to.meta?.public) {
    if (userStore.isLoggedIn && to.path === '/login') {
      next('/dashboard')
      return
    }
    next()
    return
  }

  if (!userStore.isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router
