import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'clubs',
        name: 'Clubs',
        component: () => import('@/views/clubs/ClubList.vue')
      },
      {
        path: 'clubs/:id',
        name: 'ClubDetail',
        component: () => import('@/views/clubs/ClubDetail.vue')
      },
      {
        path: 'my-clubs',
        name: 'MyClubs',
        component: () => import('@/views/clubs/MyClubs.vue')
      },
      {
        path: 'recruitment',
        name: 'Recruitment',
        component: () => import('@/views/recruitment/RecruitmentList.vue')
      },
      {
        path: 'recruitment/:id',
        name: 'RecruitmentDetail',
        component: () => import('@/views/recruitment/RecruitmentDetail.vue')
      },
      {
        path: 'my-applications',
        name: 'MyApplications',
        component: () => import('@/views/recruitment/MyApplications.vue')
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/activities/ActivityList.vue')
      },
      {
        path: 'activities/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/activities/ActivityDetail.vue')
      },
      {
        path: 'funds/:clubId',
        name: 'Funds',
        component: () => import('@/views/funds/FundDetail.vue')
      },
      {
        path: 'admin/clubs',
        name: 'AdminClubs',
        component: () => import('@/views/admin/ClubApprovals.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/recruitment',
        name: 'AdminRecruitment',
        component: () => import('@/views/admin/RecruitmentApprovals.vue')
      },
      {
        path: 'admin/activities',
        name: 'AdminActivities',
        component: () => import('@/views/admin/ActivityApprovals.vue'),
        meta: { requiresTeacher: true }
      },
      {
        path: 'admin/funds',
        name: 'AdminFunds',
        component: () => import('@/views/admin/FundApprovals.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/reviews',
        name: 'AdminReviews',
        component: () => import('@/views/admin/AnnualReviews.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/stats',
        name: 'AdminStats',
        component: () => import('@/views/admin/Statistics.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/')
  } else if (to.meta.requiresTeacher && !userStore.isTeacher && !userStore.isAdmin) {
    next('/')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
