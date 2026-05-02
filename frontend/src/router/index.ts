import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useUserStore } from '@/stores/user'
import type { Role } from '@/types'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
    meta: { requiresAuth: false, title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
        meta: { title: '工作台', icon: 'HomeFilled' },
      },
      {
        path: 'styles',
        name: 'Styles',
        meta: { title: '款式管理', icon: 'Picture' },
        children: [
          {
            path: '',
            name: 'StyleList',
            component: () => import('@/views/styles/StyleListView.vue'),
            meta: { title: '款式列表', roles: ['designer', 'pattern_maker', 'purchaser', 'factory', 'admin'] as Role[] },
          },
          {
            path: 'create',
            name: 'StyleCreate',
            component: () => import('@/views/styles/StyleFormView.vue'),
            meta: { title: '新建款式', roles: ['designer', 'admin'] as Role[] },
          },
          {
            path: ':id',
            name: 'StyleDetail',
            component: () => import('@/views/styles/StyleDetailView.vue'),
            meta: { title: '款式详情', roles: ['designer', 'pattern_maker', 'purchaser', 'factory', 'admin'] as Role[] },
          },
          {
            path: ':id/edit',
            name: 'StyleEdit',
            component: () => import('@/views/styles/StyleFormView.vue'),
            meta: { title: '编辑款式', roles: ['designer', 'admin'] as Role[] },
          },
        ],
      },
      {
        path: 'patterns',
        name: 'Patterns',
        meta: { title: '打版管理', icon: 'Document' },
        children: [
          {
            path: '',
            name: 'PatternList',
            component: () => import('@/views/patterns/PatternListView.vue'),
            meta: { title: '版单列表', roles: ['pattern_maker', 'designer', 'admin'] as Role[] },
          },
          {
            path: ':id',
            name: 'PatternDetail',
            component: () => import('@/views/patterns/PatternDetailView.vue'),
            meta: { title: '版单详情', roles: ['pattern_maker', 'designer', 'purchaser', 'admin'] as Role[] },
          },
        ],
      },
      {
        path: 'boms',
        name: 'Boms',
        meta: { title: 'BOM管理', icon: 'List' },
        children: [
          {
            path: '',
            name: 'BomList',
            component: () => import('@/views/boms/BomListView.vue'),
            meta: { title: 'BOM列表', roles: ['purchaser', 'designer', 'admin'] as Role[] },
          },
          {
            path: ':id',
            name: 'BomDetail',
            component: () => import('@/views/boms/BomDetailView.vue'),
            meta: { title: 'BOM详情', roles: ['purchaser', 'designer', 'factory', 'admin'] as Role[] },
          },
        ],
      },
      {
        path: 'materials',
        name: 'Materials',
        meta: { title: '物料管理', icon: 'Box' },
        children: [
          {
            path: '',
            name: 'MaterialList',
            component: () => import('@/views/materials/MaterialListView.vue'),
            meta: { title: '物料列表', roles: ['purchaser', 'admin'] as Role[] },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/NotFoundView.vue'),
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(
  async (
    to: RouteLocationNormalized,
    _from: RouteLocationNormalized,
    next: NavigationGuardNext,
  ) => {
    const userStore = useUserStore()
    
    if (!userStore.isLoggedIn) {
      userStore.initFromStorage()
    }

    document.title = (to.meta.title as string) || '服装打版与生产协同系统'

    if (to.meta.requiresAuth === false) {
      if (userStore.isLoggedIn && to.path === '/login') {
        return next('/dashboard')
      }
      return next()
    }

    if (!userStore.isLoggedIn) {
      return next({ path: '/login', query: { redirect: to.fullPath } })
    }

    const roles = to.meta.roles as Role[] | undefined
    if (roles && roles.length > 0) {
      if (!userStore.currentRole || !roles.includes(userStore.currentRole)) {
        return next({ path: '/403' })
      }
    }

    next()
  },
)

export default router
