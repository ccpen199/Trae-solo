import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/citizen',
    name: 'Citizen',
    component: () => import('@/views/citizen/Index.vue')
  },
  {
    path: '/citizen/materials',
    name: 'CitizenMaterials',
    component: () => import('@/views/citizen/Materials.vue')
  },
  {
    path: '/citizen/apply',
    name: 'CitizenApply',
    component: () => import('@/views/citizen/Apply.vue')
  },
  {
    path: '/citizen/applications',
    name: 'CitizenApplications',
    component: () => import('@/views/citizen/Applications.vue')
  },
  {
    path: '/citizen/authorizations',
    name: 'CitizenAuthorizations',
    component: () => import('@/views/citizen/Authorizations.vue')
  },
  {
    path: '/window',
    name: 'Window',
    component: () => import('@/views/window/Index.vue')
  },
  {
    path: '/window/applications',
    name: 'WindowApplications',
    component: () => import('@/views/window/Applications.vue')
  },
  {
    path: '/window/applications/:id',
    name: 'WindowApplicationDetail',
    component: () => import('@/views/window/ApplicationDetail.vue')
  },
  {
    path: '/approver',
    name: 'Approver',
    component: () => import('@/views/approver/Index.vue')
  },
  {
    path: '/approver/applications',
    name: 'ApproverApplications',
    component: () => import('@/views/approver/Applications.vue')
  },
  {
    path: '/approver/applications/:id',
    name: 'ApproverApplicationDetail',
    component: () => import('@/views/approver/ApplicationDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
