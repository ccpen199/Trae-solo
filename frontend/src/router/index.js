import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('../views/Products.vue')
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('../views/ProductDetail.vue')
      },
      {
        path: 'access',
        name: 'Access',
        component: () => import('../views/Access.vue')
      },
      {
        path: 'access/verify',
        name: 'AccessVerify',
        component: () => import('../views/AccessVerify.vue')
      },
      {
        path: 'visitors',
        name: 'Visitors',
        component: () => import('../views/Visitors.vue')
      },
      {
        path: 'visitors/create',
        name: 'VisitorCreate',
        component: () => import('../views/VisitorCreate.vue')
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('../views/Services.vue')
      },
      {
        path: 'services/merchants/:id',
        name: 'MerchantDetail',
        component: () => import('../views/MerchantDetail.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'profile/rooms',
        name: 'ProfileRooms',
        component: () => import('../views/ProfileRooms.vue')
      },
      {
        path: 'profile/orders',
        name: 'ProfileOrders',
        component: () => import('../views/ProfileOrders.vue')
      },
      {
        path: 'profile/coupons',
        name: 'ProfileCoupons',
        component: () => import('../views/ProfileCoupons.vue')
      },
      {
        path: 'profile/announcements',
        name: 'ProfileAnnouncements',
        component: () => import('../views/ProfileAnnouncements.vue')
      },
      {
        path: 'profile/visitors',
        name: 'ProfileVisitors',
        component: () => import('../views/ProfileVisitors.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('../views/Admin.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('../views/AdminUsers.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/rooms',
        name: 'AdminRooms',
        component: () => import('../views/AdminRooms.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/devices',
        name: 'AdminDevices',
        component: () => import('../views/AdminDevices.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/alerts',
        name: 'AdminAlerts',
        component: () => import('../views/AdminAlerts.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/events',
        name: 'AdminEvents',
        component: () => import('../views/AdminEvents.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/merchants',
        name: 'AdminMerchants',
        component: () => import('../views/AdminMerchants.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/announcements',
        name: 'AdminAnnouncements',
        component: () => import('../views/AdminAnnouncements.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      },
      {
        path: 'admin/overstay',
        name: 'AdminOverstay',
        component: () => import('../views/AdminOverstay.vue'),
        meta: { requiresRole: ['admin', 'property'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
    return
  }
  
  if (to.meta.requiresRole && !to.meta.requiresRole.includes(userStore.userRole)) {
    next('/')
    return
  }
  
  next()
})

export default router
