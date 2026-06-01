import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue')
  },
  {
    path: '/practice/:id',
    name: 'Practice',
    component: () => import('../views/Practice.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue')
  },
  {
    path: '/admin/resources',
    name: 'ResourceManage',
    component: () => import('../views/ResourceManage.vue')
  },
  {
    path: '/admin/students',
    name: 'StudentManage',
    component: () => import('../views/StudentManage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
