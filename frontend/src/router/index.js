import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'shipper/orders',
        name: 'ShipperOrders',
        component: () => import('@/views/shipper/Orders.vue')
      },
      {
        path: 'shipper/create-order',
        name: 'CreateOrder',
        component: () => import('@/views/shipper/CreateOrder.vue')
      },
      {
        path: 'driver/orders',
        name: 'DriverOrders',
        component: () => import('@/views/driver/Orders.vue')
      },
      {
        path: 'driver/vehicles',
        name: 'DriverVehicles',
        component: () => import('@/views/driver/Vehicles.vue')
      },
      {
        path: 'admin/orders',
        name: 'AdminOrders',
        component: () => import('@/views/admin/Orders.vue')
      },
      {
        path: 'admin/drivers',
        name: 'AdminDrivers',
        component: () => import('@/views/admin/Drivers.vue')
      },
      {
        path: 'admin/vehicles',
        name: 'AdminVehicles',
        component: () => import('@/views/admin/Vehicles.vue')
      },
      {
        path: 'admin/exceptions',
        name: 'AdminExceptions',
        component: () => import('@/views/admin/Exceptions.vue')
      },
      {
        path: 'admin/sla',
        name: 'AdminSLA',
        component: () => import('@/views/admin/SLA.vue')
      },
      {
        path: 'admin/heatmap',
        name: 'AdminHeatmap',
        component: () => import('@/views/admin/Heatmap.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const userStr = localStorage.getItem('user')
  const publicPaths = ['/login']
  let userValid = false
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userValid = user && user.id && user.role
    } catch (e) {
      localStorage.removeItem('user')
    }
  }
  
  if (publicPaths.includes(to.path)) {
    if (userValid) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    if (!userValid) {
      next('/login')
    } else {
      next()
    }
  }
})

export default router
