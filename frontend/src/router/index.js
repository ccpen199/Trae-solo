import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录', guest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '注册', guest: true }
  },
  {
    path: '/doctors',
    name: 'Doctors',
    component: () => import('../views/Doctors.vue'),
    meta: { title: '找医生' }
  },
  {
    path: '/doctors/:id',
    name: 'DoctorDetail',
    component: () => import('../views/DoctorDetail.vue'),
    meta: { title: '医生详情' }
  },
  {
    path: '/hospitals',
    name: 'Hospitals',
    component: () => import('../views/Hospitals.vue'),
    meta: { title: '找医院' }
  },
  {
    path: '/symptoms',
    name: 'Symptoms',
    component: () => import('../views/Symptoms.vue'),
    meta: { title: '症状自查' }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('../views/Community.vue'),
    meta: { title: '社区' }
  },
  {
    path: '/community/:id',
    name: 'PostDetail',
    component: () => import('../views/PostDetail.vue'),
    meta: { title: '帖子详情' }
  },
  {
    path: '/pets',
    name: 'Pets',
    component: () => import('../views/Pets.vue'),
    meta: { title: '宠物档案', requiresAuth: true }
  },
  {
    path: '/consultations',
    name: 'Consultations',
    component: () => import('../views/Consultations.vue'),
    meta: { title: '我的咨询', requiresAuth: true }
  },
  {
    path: '/consultations/:id',
    name: 'ConsultationDetail',
    component: () => import('../views/ConsultationDetail.vue'),
    meta: { title: '咨询详情', requiresAuth: true }
  },
  {
    path: '/health',
    name: 'Health',
    component: () => import('../views/Health.vue'),
    meta: { title: '健康管理', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { title: '管理后台', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
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

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '云医宠'} - 宠物医疗问诊平台`
  
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  if (to.meta.requiresAdmin && userStore.user?.role !== 'admin') {
    ElMessage.error('没有管理员权限')
    next({ path: '/home' })
    return
  }
  
  if (to.meta.guest && userStore.isLoggedIn) {
    next({ path: '/home' })
    return
  }
  
  next()
})

export default router
