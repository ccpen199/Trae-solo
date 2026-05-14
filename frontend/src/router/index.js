import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import ActivityList from '../views/ActivityList.vue'
import ActivityDetail from '../views/ActivityDetail.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Favorites from '../views/Favorites.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/activities', name: 'ActivityList', component: ActivityList },
  { path: '/activities/:id', name: 'ActivityDetail', component: ActivityDetail },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/favorites', name: 'Favorites', component: Favorites }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router