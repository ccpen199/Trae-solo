import React, { lazy, Suspense } from 'react'
import { Navigate, useRoutes, type RouteObject } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from '@/layouts/MainLayout'
import LoginLayout from '@/layouts/LoginLayout'

const lazyLoad = (importFn: () => Promise<{ default: React.ComponentType }>) => {
  const LazyComponent = lazy(importFn)
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
          <Spin size="large" />
        </div>
      }
    >
      <LazyComponent />
    </Suspense>
  )
}

const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginLayout />
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: lazyLoad(() => import('@/pages/dashboard/index'))
      },
      {
        path: 'departments',
        element: lazyLoad(() => import('@/pages/departments/index'))
      },
      {
        path: 'services',
        element: lazyLoad(() => import('@/pages/services/index'))
      },
      {
        path: 'certificates',
        element: lazyLoad(() => import('@/pages/certificates/index'))
      },
      {
        path: 'tickets',
        element: lazyLoad(() => import('@/pages/tickets/index'))
      },
      {
        path: 'audit-logs',
        element: lazyLoad(() => import('@/pages/audit-logs/index'))
      },
      {
        path: 'city-data-secretary',
        element: lazyLoad(() => import('@/pages/city-data-secretary/index'))
      },
      {
        path: 'system/users',
        element: lazyLoad(() => import('@/pages/system/users/index'))
      },
      {
        path: 'system/roles',
        element: lazyLoad(() => import('@/pages/system/roles/index'))
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />
  }
]

const AppRouter: React.FC = () => {
  const element = useRoutes(routes)
  return element
}

export default AppRouter
