import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    redirect: '/homework',
    children: [
      {
        path: 'homework',
        name: 'HomeworkList',
        component: () => import('../views/HomeworkList.vue')
      },
      {
        path: 'homework/:id',
        name: 'HomeworkDetail',
        component: () => import('../views/HomeworkDetail.vue')
      },
      {
        path: 'homework/:id/overview',
        name: 'HomeworkOverview',
        component: () => import('../views/HomeworkOverview.vue')
      },
      {
        path: 'homework/:id/student/:studentId',
        name: 'StudentHomework',
        component: () => import('../views/StudentHomework.vue')
      },
      {
        path: 'class',
        name: 'ClassList',
        component: () => import('../views/ClassList.vue')
      },
      {
        path: 'class/:id',
        name: 'ClassDetail',
        component: () => import('../views/ClassDetail.vue')
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
  const token = localStorage.getItem('token')
  
  if (to.path !== '/login' && to.path !== '/register' && !token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/homework')
  } else {
    next()
  }
})

export default router