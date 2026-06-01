import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

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
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue')
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/courses/List.vue')
      },
      {
        path: 'courses/:id',
        name: 'CourseDetail',
        component: () => import('@/views/courses/Detail.vue')
      },
      {
        path: 'live/:courseId',
        name: 'LiveRoom',
        component: () => import('@/views/live/Room.vue')
      },
      {
        path: 'exams/:id',
        name: 'Exam',
        component: () => import('@/views/exam/Exam.vue')
      },
      {
        path: 'my-courses',
        name: 'MyCourses',
        component: () => import('@/views/student/MyCourses.vue')
      },
      {
        path: 'my-certificates',
        name: 'MyCertificates',
        component: () => import('@/views/student/Certificates.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/courses',
        name: 'AdminCourses',
        component: () => import('@/views/admin/Courses.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/statistics',
        name: 'Statistics',
        component: () => import('@/views/admin/Statistics.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/exceptions',
        name: 'Exceptions',
        component: () => import('@/views/admin/Exceptions.vue'),
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
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
