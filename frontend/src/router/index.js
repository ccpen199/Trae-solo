import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/employees',
    name: 'Employees',
    component: () => import('@/views/Employees.vue'),
    meta: { title: '员工管理' }
  },
  {
    path: '/employees/:id',
    name: 'EmployeeDetail',
    component: () => import('@/views/EmployeeDetail.vue'),
    meta: { title: '员工详情' }
  },
  {
    path: '/departments',
    name: 'Departments',
    component: () => import('@/views/Departments.vue'),
    meta: { title: '部门管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 人力资源管理系统` : '人力资源管理系统'
  next()
})

export default router
