import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

import ScanPage from './pages/courier/ScanPage';
import DeliveryPage from './pages/courier/DeliveryPage';

import DashboardPage from './pages/admin/DashboardPage';
import PackageManagePage from './pages/admin/PackageManagePage';
import ExceptionsPage from './pages/admin/ExceptionsPage';

import SearchPage from './pages/cs/SearchPage';

function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RedirectByRole() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'courier':
      return <Navigate to="/courier/scan" replace />;
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'customer_service':
      return <Navigate to="/cs/search" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function Router() {
  return useRoutes([
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/',
      element: (
        <PrivateRoute>
          <RedirectByRole />
        </PrivateRoute>
      ),
    },
    {
      path: '/courier/*',
      element: (
        <PrivateRoute allowedRoles={['courier']}>
          <Layout>
            <CourierRoutes />
          </Layout>
        </PrivateRoute>
      ),
    },
    {
      path: '/admin/*',
      element: (
        <PrivateRoute allowedRoles={['admin']}>
          <Layout>
            <AdminRoutes />
          </Layout>
        </PrivateRoute>
      ),
    },
    {
      path: '/cs/*',
      element: (
        <PrivateRoute allowedRoles={['customer_service', 'admin']}>
          <Layout>
            <CSRoutes />
          </Layout>
        </PrivateRoute>
      ),
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ]);
}

function CourierRoutes() {
  return useRoutes([
    { path: 'scan', element: <ScanPage /> },
    { path: 'delivery', element: <DeliveryPage /> },
    { path: 'packages', element: <DeliveryPage /> },
    { path: '*', element: <Navigate to="/courier/scan" replace /> },
  ]);
}

function AdminRoutes() {
  return useRoutes([
    { path: 'dashboard', element: <DashboardPage /> },
    { path: 'packages', element: <PackageManagePage /> },
    { path: 'exceptions', element: <ExceptionsPage /> },
    { path: 'performance', element: <ExceptionsPage /> },
    { path: '*', element: <Navigate to="/admin/dashboard" replace /> },
  ]);
}

function CSRoutes() {
  return useRoutes([
    { path: 'search', element: <SearchPage /> },
    { path: 'exceptions', element: <ExceptionsPage /> },
    { path: '*', element: <Navigate to="/cs/search" replace /> },
  ]);
}
