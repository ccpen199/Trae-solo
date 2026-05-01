import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页', requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/questions',
    name: 'Questions',
    component: () => import('@/views/Questions.vue'),
    meta: { title: '问题列表', requiresAuth: false }
  },
  {
    path: '/questions/:questionId',
    name: 'QuestionDetail',
    component: () => import('@/views/QuestionDetail.vue'),
    meta: { title: '问题详情', requiresAuth: false }
  },
  {
    path: '/ask',
    name: 'AskQuestion',
    component: () => import('@/views/AskQuestion.vue'),
    meta: { title: '提问', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ProfileOverview',
        component: () => import('@/views/profile/Overview.vue')
      },
      {
        path: 'questions',
        name: 'ProfileQuestions',
        component: () => import('@/views/profile/MyQuestions.vue')
      },
      {
        path: 'answers',
        name: 'ProfileAnswers',
        component: () => import('@/views/profile/MyAnswers.vue')
      },
      {
        path: 'credit',
        name: 'ProfileCredit',
        component: () => import('@/views/profile/Credit.vue')
      },
      {
        path: 'wallet',
        name: 'ProfileWallet',
        component: () => import('@/views/profile/Wallet.vue')
      },
      {
        path: 'settings',
        name: 'ProfileSettings',
        component: () => import('@/views/profile/Settings.vue')
      }
    ]
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('@/views/Knowledge.vue'),
    meta: { title: '知识库', requiresAuth: false }
  },
  {
    path: '/knowledge/:nodeId',
    name: 'KnowledgeDetail',
    component: () => import('@/views/KnowledgeDetail.vue'),
    meta: { title: '知识库详情', requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/Admin.vue'),
    meta: { title: '管理后台', requiresAuth: true, roles: ['admin', 'editor'] },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'moderation',
        name: 'AdminModeration',
        component: () => import('@/views/admin/Moderation.vue')
      },
      {
        path: 'archives',
        name: 'AdminArchives',
        component: () => import('@/views/admin/Archives.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue')
      }
    ]
  },
  {
    path: '/workflow/:questionId',
    name: 'Workflow',
    component: () => import('@/views/Workflow.vue'),
    meta: { title: '工作流状态', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  document.title = to.meta.title ? `${to.meta.title} - QA Community` : 'QA Community'
  
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    try {
      await userStore.checkAuth()
      if (!userStore.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
      }
    } catch (error) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!userStore.user || !to.meta.roles.includes(userStore.user.role)) {
      next({ name: 'Home' })
      return
    }
  }
  
  next()
})

export default router
