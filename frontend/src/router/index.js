import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import TableSelect from '../pages/TableSelect.vue'
import Queue from '../pages/Queue.vue'
import Menu from '../pages/Menu.vue'
import Cart from '../pages/Cart.vue'
import Order from '../pages/Order.vue'
import Review from '../pages/Review.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/table', component: TableSelect },
  { path: '/queue', component: Queue },
  { path: '/menu', component: Menu },
  { path: '/cart', component: Cart },
  { path: '/order/:id', component: Order },
  { path: '/review/:orderId', component: Review }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
