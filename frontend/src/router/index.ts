import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页 - 智汇教育' }
    },
    {
      path: '/courses',
      name: 'courses',
      component: () => import('@/views/CoursesView.vue'),
      meta: { title: '课程中心 - 智汇教育' }
    },
    {
      path: '/courses/:id',
      name: 'course-detail',
      component: () => import('@/views/CourseDetailView.vue'),
      meta: { title: '课程详情 - 智汇教育' }
    },
    {
      path: '/resources',
      name: 'resources',
      component: () => import('@/views/ResourcesView.vue'),
      meta: { title: '资源下载 - 智汇教育' }
    },
    {
      path: '/questions',
      name: 'questions',
      component: () => import('@/views/QuestionsView.vue'),
      meta: { title: '问答社区 - 智汇教育' }
    },
    {
      path: '/questions/:id',
      name: 'question-detail',
      component: () => import('@/views/QuestionDetailView.vue'),
      meta: { title: '问题详情 - 智汇教育' }
    },
    {
      path: '/tests',
      name: 'tests',
      component: () => import('@/views/TestsView.vue'),
      meta: { title: '在线测试 - 智汇教育' }
    },
    {
      path: '/tests/:id',
      name: 'test-detail',
      component: () => import('@/views/TestDetailView.vue'),
      meta: { title: '测试详情 - 智汇教育', requiresAuth: true }
    },
    {
      path: '/jobs',
      name: 'jobs',
      component: () => import('@/views/JobsView.vue'),
      meta: { title: '就业服务 - 智汇教育' }
    },
    {
      path: '/jobs/:id',
      name: 'job-detail',
      component: () => import('@/views/JobDetailView.vue'),
      meta: { title: '职位详情 - 智汇教育' }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录 - 智汇教育', guestOnly: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { title: '注册 - 智汇教育', guestOnly: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { title: '个人中心 - 智汇教育', requiresAuth: true }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.guestOnly && userStore.isLoggedIn) {
    next({ name: 'home' })
    return
  }

  next()
})

export default router
