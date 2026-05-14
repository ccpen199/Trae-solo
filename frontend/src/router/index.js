import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'
import { showToast } from 'vant'

const routes = [
  { path: '/', name: 'Splash', component: () => import('../pages/SplashPage.vue') },
  { path: '/welcome', name: 'Welcome', component: () => import('../pages/WelcomePage.vue') },
  { path: '/login', name: 'Login', component: () => import('../pages/LoginPage.vue') },
  { path: '/register', name: 'Register', component: () => import('../pages/RegisterPage.vue') },
  { path: '/reset-password', name: 'ResetPassword', component: () => import('../pages/ResetPasswordPage.vue') },
  { path: '/home', name: 'Home', component: () => import('../pages/HomePage.vue') },
  { path: '/search', name: 'Search', component: () => import('../pages/SearchPage.vue') },
  { path: '/search-result', name: 'SearchResult', component: () => import('../pages/SearchResultPage.vue') },
  { path: '/product/:id', name: 'ProductDetail', component: () => import('../pages/ProductDetailPage.vue') },
  { path: '/cart', name: 'Cart', component: () => import('../pages/CartPage.vue') },
  { path: '/address', name: 'Address', component: () => import('../pages/AddressPage.vue') },
  { path: '/address-add', name: 'AddressAdd', component: () => import('../pages/AddressAddPage.vue') },
  { path: '/orders', name: 'Orders', component: () => import('../pages/OrdersPage.vue') },
  { path: '/order/:id', name: 'OrderDetail', component: () => import('../pages/OrderDetailPage.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../pages/ProfilePage.vue') },
  { path: '/scan', name: 'Scan', component: () => import('../pages/ScanPage.vue') },
  { path: '/ad-detail/:id', name: 'AdDetail', component: () => import('../pages/AdDetailPage.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authRequired = ['/cart', '/orders', '/order/:id', '/address', '/address-add', '/profile']
  
  if (authRequired.includes(to.path) || authRequired.some(p => p.includes(':') && to.path.startsWith(p.split(':')[0]))) {
    if (!store.state.user.token) {
      showToast('请先登录')
      next('/login')
      return
    }
  }
  next()
})

export default router