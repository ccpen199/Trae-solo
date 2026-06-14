import { createBrowserRouter, redirect } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import Home from '@/pages/home'
import HealthCheck from '@/pages/health-check'
import HealthCheckDetail from '@/pages/health-check/[id]'
import HealthCheckBooking from '@/pages/health-check/booking'
import Insurance from '@/pages/insurance'
import InsuranceDetail from '@/pages/insurance/[id]'
import InsuranceApply from '@/pages/insurance/apply'
import HealthArchive from '@/pages/health-archive'
import RiskWarning from '@/pages/risk-warning'
import Login from '@/pages/login'
import Register from '@/pages/register'
import Profile from '@/pages/profile'
import Orders from '@/pages/orders'
import Admin from '@/pages/admin'
import NotFound from '@/pages/404'
import { useAuthStore } from '@/store/authStore'

const authLoader = async () => {
  const { isAuthenticated, token } = useAuthStore.getState()
  if (!isAuthenticated || !token) {
    return redirect('/login')
  }
  return null
}

const adminLoader = async () => {
  const { isAuthenticated, token, user } = useAuthStore.getState()
  if (!isAuthenticated || !token) {
    return redirect('/login')
  }
  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'INSURANCE_ADMIN']
  if (!user?.role || !adminRoles.includes(user.role)) {
    return redirect('/')
  }
  return null
}

const publicLoader = async () => {
  const { isAuthenticated } = useAuthStore.getState()
  if (isAuthenticated) {
    return redirect('/')
  }
  return null
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    loader: publicLoader,
  },
  {
    path: '/register',
    element: <Register />,
    loader: publicLoader,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'health-check',
        element: <HealthCheck />,
      },
      {
        path: 'health-check/:id',
        element: <HealthCheckDetail />,
      },
      {
        path: 'health-check/booking/:id',
        element: <HealthCheckBooking />,
        loader: authLoader,
      },
      {
        path: 'insurance',
        element: <Insurance />,
      },
      {
        path: 'insurance/:id',
        element: <InsuranceDetail />,
      },
      {
        path: 'insurance/apply/:id',
        element: <InsuranceApply />,
        loader: authLoader,
      },
      {
        path: 'health-archive',
        element: <HealthArchive />,
        loader: authLoader,
      },
      {
        path: 'risk-warning',
        element: <RiskWarning />,
        loader: authLoader,
      },
      {
        path: 'profile',
        element: <Profile />,
        loader: authLoader,
      },
      {
        path: 'orders',
        element: <Orders />,
        loader: authLoader,
      },
      {
        path: 'admin',
        element: <Admin />,
        loader: adminLoader,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

export default router
