import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'

import Whitelist from './views/Whitelist.vue'
import Register from './views/Register.vue'
import Home from './views/Home.vue'
import Commission from './views/Commission.vue'
import CreditApply from './views/CreditApply.vue'
import BankBind from './views/BankBind.vue'
import AdvanceApply from './views/AdvanceApply.vue'

const routes = [
  { path: '/', name: 'Whitelist', component: Whitelist },
  { path: '/register', name: 'Register', component: Register },
  { path: '/home', name: 'Home', component: Home },
  { path: '/commission', name: 'Commission', component: Commission },
  { path: '/credit', name: 'CreditApply', component: CreditApply },
  { path: '/bank', name: 'BankBind', component: BankBind },
  { path: '/advance/:batchId', name: 'AdvanceApply', component: AdvanceApply, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.use(Vant)
app.mount('#app')
