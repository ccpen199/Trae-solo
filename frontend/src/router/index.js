import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/user/Index.vue'),
        meta: { title: '用户管理', permission: 'user:list' }
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('@/views/department/Index.vue'),
        meta: { title: '系别管理', permission: 'department:list' }
      },
      {
        path: 'classes',
        name: 'Classes',
        component: () => import('@/views/class/Index.vue'),
        meta: { title: '班级管理', permission: 'class:list' }
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('@/views/student/Index.vue'),
        meta: { title: '学生管理', permission: 'student:list' }
      },
      {
        path: 'courses',
        name: 'Courses',
        component: () => import('@/views/course/Index.vue'),
        meta: { title: '课程管理', permission: 'course:list' }
      },
      {
        path: 'grades',
        name: 'Grades',
        component: () => import('@/views/grade/Index.vue'),
        meta: { title: '成绩管理', permission: 'grade:list' }
      },
      {
        path: 'my-grades',
        name: 'MyGrades',
        component: () => import('@/views/grade/MyGrades.vue'),
        meta: { title: '我的成绩', permission: 'grade:my' }
      },
      {
        path: 'grade-statistics',
        name: 'GradeStatistics',
        component: () => import('@/views/grade/Statistics.vue'),
        meta: { title: '成绩统计', permission: 'grade:statistics' }
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
  
  document.title = to.meta.title ? `${to.meta.title} - 学生成绩管理系统` : '学生成绩管理系统'
  
  if (to.meta.requiresAuth === false) {
    if (to.path === '/login' && userStore.isLoggedIn) {
      next({ path: '/dashboard' })
    } else {
      next()
    }
    return
  }
  
  if (!userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
    next({ path: '/dashboard' })
    return
  }
  
  next()
})

export default router
