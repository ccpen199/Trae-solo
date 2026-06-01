import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/resume',
    name: 'Resume',
    component: () => import('../views/resume/ResumeUpload.vue'),
    meta: { title: '简历解析' }
  },
  {
    path: '/resume/list',
    name: 'ResumeList',
    component: () => import('../views/resume/ResumeList.vue'),
    meta: { title: '简历管理' }
  },
  {
    path: '/resume/:id',
    name: 'ResumeDetail',
    component: () => import('../views/resume/ResumeDetail.vue'),
    meta: { title: '简历详情' }
  },
  {
    path: '/interview',
    name: 'Interview',
    component: () => import('../views/interview/InterviewList.vue'),
    meta: { title: 'AI模拟面试' }
  },
  {
    path: '/interview/:id',
    name: 'InterviewRoom',
    component: () => import('../views/interview/InterviewRoom.vue'),
    meta: { title: '面试间' }
  },
  {
    path: '/career',
    name: 'Career',
    component: () => import('../views/career/CareerPlanner.vue'),
    meta: { title: '职业路径规划' }
  },
  {
    path: '/talent',
    name: 'Talent',
    component: () => import('../views/talent/TalentSearch.vue'),
    meta: { title: '智能人才寻源' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/dashboard/Dashboard.vue'),
    meta: { title: '数据看板' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/admin/AnticheatAdmin.vue'),
    meta: { title: '反作弊管理' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - AI职业发展平台` : 'AI职业发展平台'
  next()
})

export default router
