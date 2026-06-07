import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/FrontendLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('@/views/frontend/Home.vue') },
      { path: 'brands', name: 'Brands', component: () => import('@/views/frontend/Brands.vue') },
      { path: 'brands/:id', name: 'BrandDetail', component: () => import('@/views/frontend/BrandDetail.vue') },
      { path: 'rankings', name: 'Rankings', component: () => import('@/views/frontend/Rankings.vue') },
      { path: 'rankings/:categoryId', name: 'RankingDetail', component: () => import('@/views/frontend/RankingDetail.vue') },
      { path: 'rankings/compare', name: 'BrandCompare', component: () => import('@/views/frontend/BrandCompare.vue') },
      { path: 'knowledge', name: 'Knowledge', component: () => import('@/views/frontend/Knowledge.vue') },
      { path: 'knowledge/:id', name: 'KnowledgeDetail', component: () => import('@/views/frontend/KnowledgeDetail.vue') },
      { path: 'collections', name: 'Collections', component: () => import('@/views/frontend/Collections.vue') },
      { path: 'login', name: 'Login', component: () => import('@/views/frontend/Login.vue') },
      { path: 'register', name: 'Register', component: () => import('@/views/frontend/Register.vue') }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'AdminDashboard', component: () => import('@/views/admin/Dashboard.vue') },
      { path: 'brands', name: 'AdminBrands', component: () => import('@/views/admin/Brands.vue') },
      { path: 'rankings', name: 'AdminRankings', component: () => import('@/views/admin/Rankings.vue') },
      { path: 'knowledge', name: 'AdminKnowledge', component: () => import('@/views/admin/Knowledge.vue') },
      { path: 'traceability', name: 'AdminTraceability', component: () => import('@/views/admin/Traceability.vue') },
      { path: 'expert-reviews', name: 'AdminExpertReviews', component: () => import('@/views/admin/ExpertReviews.vue') },
      { path: 'reports', name: 'AdminReports', component: () => import('@/views/admin/Reports.vue') },
      { path: 'alerts', name: 'AdminAlerts', component: () => import('@/views/admin/Alerts.vue') },
      { path: 'data-sources', name: 'AdminDataSources', component: () => import('@/views/admin/DataSources.vue') },
      { path: 'users', name: 'AdminUsers', component: () => import('@/views/admin/Users.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
