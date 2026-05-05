import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页 - 营销活动中心' },
  },
  {
    path: '/wheel',
    name: 'Wheel',
    component: () => import('@/views/Wheel.vue'),
    meta: { title: '大转盘 - 营销活动中心' },
  },
  {
    path: '/egg',
    name: 'Egg',
    component: () => import('@/views/Egg.vue'),
    meta: { title: '砸金蛋 - 营销活动中心' },
  },
  {
    path: '/prizes',
    name: 'Prizes',
    component: () => import('@/views/Prizes.vue'),
    meta: { title: '我的奖品 - 营销活动中心', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  const userStore = useUserStore()

  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({ path: '/', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
