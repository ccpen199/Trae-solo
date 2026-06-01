import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: () => import('./views/Dashboard.vue'), meta: { title: '数据看板' } },
  { path: '/topics', component: () => import('./views/Topics.vue'), meta: { title: '话题库管理' } },
  { path: '/topics/:id', component: () => import('./views/TopicDetail.vue'), meta: { title: '话题详情' } },
  { path: '/posts', component: () => import('./views/Posts.vue'), meta: { title: '内容管理' } },
  { path: '/posts/:id', component: () => import('./views/PostDetail.vue'), meta: { title: '内容详情' } },
  { path: '/moderation', component: () => import('./views/Moderation.vue'), meta: { title: '审核队列' } },
  { path: '/tag-changes', component: () => import('./views/TagChanges.vue'), meta: { title: '标签变更日志' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 社区话题标签系统` : '社区话题标签系统'
  next()
})

export default router
