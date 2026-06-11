import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/personal', name: 'PersonalHome', component: () => import('../views/personal/Home.vue'), meta: { role: 'personal' } },
  { path: '/personal/contracts', name: 'PersonalContracts', component: () => import('../views/personal/Contracts.vue'), meta: { role: 'personal' } },
  { path: '/personal/unemployment', name: 'PersonalUnemployment', component: () => import('../views/personal/Unemployment.vue'), meta: { role: 'personal' } },
  { path: '/personal/title', name: 'PersonalTitle', component: () => import('../views/personal/Title.vue'), meta: { role: 'personal' } },
  { path: '/personal/dispute', name: 'PersonalDispute', component: () => import('../views/personal/Dispute.vue'), meta: { role: 'personal' } },
  { path: '/personal/policy', name: 'PersonalPolicy', component: () => import('../views/personal/PolicyCalc.vue'), meta: { role: 'personal' } },
  { path: '/enterprise', name: 'EnterpriseHome', component: () => import('../views/enterprise/Home.vue'), meta: { role: 'enterprise' } },
  { path: '/enterprise/employment', name: 'EnterpriseEmployment', component: () => import('../views/enterprise/Employment.vue'), meta: { role: 'enterprise' } },
  { path: '/enterprise/contracts', name: 'EnterpriseContracts', component: () => import('../views/enterprise/Contracts.vue'), meta: { role: 'enterprise' } },
  { path: '/enterprise/subsidy', name: 'EnterpriseSubsidy', component: () => import('../views/enterprise/Subsidy.vue'), meta: { role: 'enterprise' } },
  { path: '/enterprise/wage', name: 'EnterpriseWage', component: () => import('../views/enterprise/Wage.vue'), meta: { role: 'enterprise' } },
  { path: '/admin', name: 'AdminHome', component: () => import('../views/admin/Home.vue'), meta: { role: 'admin' } },
  { path: '/admin/cross', name: 'AdminCross', component: () => import('../views/admin/CrossSystem.vue'), meta: { role: 'admin' } },
  { path: '/admin/title', name: 'AdminTitle', component: () => import('../views/admin/TitleReview.vue'), meta: { role: 'admin' } },
  { path: '/admin/subsidy', name: 'AdminSubsidy', component: () => import('../views/admin/SubsidyReview.vue'), meta: { role: 'admin' } },
  { path: '/admin/dispute', name: 'AdminDispute', component: () => import('../views/admin/DisputeMediation.vue'), meta: { role: 'admin' } },
  { path: '/admin/opinion', name: 'AdminOpinion', component: () => import('../views/admin/OpinionMonitor.vue'), meta: { role: 'admin' } },
  { path: '/admin/policy', name: 'AdminPolicy', component: () => import('../views/admin/PolicyRecords.vue'), meta: { role: 'admin' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.public) return next()
  if (!auth.token) return next('/login')
  if (to.meta.role && auth.userType !== to.meta.role && to.meta.role !== undefined) {
    const map = { personal: '/personal', enterprise: '/enterprise', admin: '/admin' }
    return next(map[auth.userType] || '/login')
  }
  next()
})

export default router
