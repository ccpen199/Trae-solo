import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import AddDevice from '../views/AddDevice.vue'
import DeviceDetail from '../views/DeviceDetail.vue'
import Scenes from '../views/Scenes.vue'
import Analytics from '../views/Analytics.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/add-device', name: 'AddDevice', component: AddDevice },
  { path: '/device/:id', name: 'DeviceDetail', component: DeviceDetail },
  { path: '/scenes', name: 'Scenes', component: Scenes },
  { path: '/analytics', name: 'Analytics', component: Analytics }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
