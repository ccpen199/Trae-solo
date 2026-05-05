import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/teacher/entry',
    name: 'TeacherEntry',
    component: () => import('@/views/teacher/Entry.vue'),
    meta: { title: '教师入职' }
  },
  {
    path: '/teacher/list',
    name: 'TeacherList',
    component: () => import('@/views/teacher/List.vue'),
    meta: { title: '教师列表' }
  },
  {
    path: '/teacher/accounts',
    name: 'TeacherAccountList',
    component: () => import('@/views/teacher/AccountList.vue'),
    meta: { title: '账号管理' }
  },
  {
    path: '/teacher/detail/:id',
    name: 'TeacherDetail',
    component: () => import('@/views/teacher/Detail.vue'),
    meta: { title: '教师详情' }
  },
  {
    path: '/approval/submit',
    name: 'ApprovalSubmit',
    component: () => import('@/views/approval/Submit.vue'),
    meta: { title: '提交审批' }
  },
  {
    path: '/approval/list',
    name: 'ApprovalList',
    component: () => import('@/views/approval/List.vue'),
    meta: { title: '审批列表' }
  },
  {
    path: '/approval/detail/:id',
    name: 'ApprovalDetail',
    component: () => import('@/views/approval/Detail.vue'),
    meta: { title: '审批详情' }
  },
  {
    path: '/department',
    name: 'Department',
    component: () => import('@/views/Department.vue'),
    meta: { title: '部门管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
