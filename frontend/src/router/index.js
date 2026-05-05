import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/articles',
    name: 'ArticleList',
    component: () => import('@/views/ArticleList.vue'),
    meta: { title: '文章列表' }
  },
  {
    path: '/articles/:id',
    name: 'ArticleDetail',
    component: () => import('@/views/ArticleDetail.vue'),
    meta: { title: '文章详情' }
  },
  {
    path: '/create',
    name: 'ArticleCreate',
    component: () => import('@/views/ArticleCreate.vue'),
    meta: { title: '发帖', requiresAuth: true }
  },
  {
    path: '/edit/:id',
    name: 'ArticleEdit',
    component: () => import('@/views/ArticleCreate.vue'),
    meta: { title: '编辑帖子', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminLayout',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { title: '后台管理', requiresAuth: true, requiresAdmin: true },
    redirect: '/admin/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'articles',
        name: 'AdminArticles',
        component: () => import('@/views/admin/ArticleManage.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'categories',
        name: 'AdminCategories',
        component: () => import('@/views/admin/CategoryManage.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UserManage.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'roles',
        name: 'AdminRoles',
        component: () => import('@/views/admin/RoleManage.vue'),
        meta: { title: '角色管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - BBS论坛` : 'BBS论坛'
  
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  if (to.meta.requiresAdmin && user) {
    const roles = user.roles || []
    const isAdmin = roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r))
    if (!isAdmin) {
      next('/home')
      return
    }
  }
  
  next()
})

export default router
