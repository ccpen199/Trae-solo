import { createRouter, createWebHistory } from 'vue-router'
import ProjectList from './views/ProjectList.vue'
import ProjectDetail from './views/ProjectDetail.vue'
import ReviewList from './views/ReviewList.vue'
import ReviewCanvas from './views/ReviewCanvas.vue'
import VersionDiff from './views/VersionDiff.vue'
import ReportsSelect from './views/ReportsSelect.vue'
import Reports from './views/Reports.vue'

const routes = [
  { path: '/', name: 'ProjectList', component: ProjectList },
  { path: '/project/:id', name: 'ProjectDetail', component: ProjectDetail, props: true },
  { path: '/reviews', name: 'ReviewList', component: ReviewList },
  { path: '/review/:id', name: 'ReviewCanvas', component: ReviewCanvas, props: true },
  { path: '/version-diff/:v1/:v2', name: 'VersionDiff', component: VersionDiff, props: true },
  { path: '/reports', name: 'ReportsSelect', component: ReportsSelect },
  { path: '/reports/:projectId', name: 'Reports', component: Reports, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
