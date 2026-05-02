import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'

const routes = [
  { path: '/login', component: () => import('./views/Login.vue') },
  {
    path: '/',
    component: () => import('./views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('./views/Dashboard.vue'), meta: { title: '仪表盘' } },
      { path: 'documents', component: () => import('./views/Documents.vue'), meta: { title: '文档管理' } },
      { path: 'documents/create', component: () => import('./views/DocumentForm.vue'), meta: { title: '创建文档' } },
      { path: 'documents/:id', component: () => import('./views/DocumentDetail.vue'), meta: { title: '文档详情' } },
      { path: 'directories', component: () => import('./views/Directories.vue'), meta: { title: '目录管理' } },
      { path: 'tags', component: () => import('./views/Tags.vue'), meta: { title: '标签管理' } },
      { path: 'todos', component: () => import('./views/Todos.vue'), meta: { title: '待办事项' } },
      { path: 'search', component: () => import('./views/Search.vue'), meta: { title: '搜索' } },
      { path: 'users', component: () => import('./views/Users.vue'), meta: { title: '用户管理' } },
      { path: 'audit', component: () => import('./views/Audit.vue'), meta: { title: '审计日志' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
