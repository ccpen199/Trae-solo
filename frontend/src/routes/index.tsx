import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PermissionGuard } from '@/components/PermissionGuard';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Login } from '@/pages/Login/Login';
import { AdminDashboard } from '@/pages/Dashboard/AdminDashboard';
import { Role } from '@hospital/shared';

const DoctorDashboard = lazy(
  () => import('@/pages/Dashboard/DoctorDashboard')
);
const NurseDashboard = lazy(
  () => import('@/pages/Dashboard/NurseDashboard')
);
const RegistrarDashboard = lazy(
  () => import('@/pages/Dashboard/RegistrarDashboard')
);
const PatientDashboard = lazy(
  () => import('@/pages/Dashboard/PatientDashboard')
);

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: (
      <PermissionGuard roles={['ADMIN']}>
        <MainLayout />
      </PermissionGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '/doctor',
    element: (
      <PermissionGuard roles={['DOCTOR']}>
        <MainLayout />
      </PermissionGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <SuspenseWrapper><DoctorDashboard /></SuspenseWrapper>,
      },
      {
        path: 'queue',
        element: <SuspenseWrapper><div>候诊队列</div></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '/nurse',
    element: (
      <PermissionGuard roles={['NURSE']}>
        <MainLayout />
      </PermissionGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <SuspenseWrapper><NurseDashboard /></SuspenseWrapper>,
      },
      {
        path: 'queue',
        element: <SuspenseWrapper><div>候诊队列</div></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '/registrar',
    element: (
      <PermissionGuard roles={['REGISTRAR']}>
        <MainLayout />
      </PermissionGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <SuspenseWrapper><RegistrarDashboard /></SuspenseWrapper>,
      },
      {
        path: 'registration',
        element: <SuspenseWrapper><div>挂号管理</div></SuspenseWrapper>,
      },
      {
        path: 'appointment',
        element: <SuspenseWrapper><div>预约管理</div></SuspenseWrapper>,
      },
      {
        path: 'doctor',
        element: <SuspenseWrapper><div>医生管理</div></SuspenseWrapper>,
      },
      {
        path: 'schedule',
        element: <SuspenseWrapper><div>排班管理</div></SuspenseWrapper>,
      },
      {
        path: 'slot',
        element: <SuspenseWrapper><div>号源管理</div></SuspenseWrapper>,
      },
      {
        path: 'statistics',
        element: <SuspenseWrapper><div>统计报表</div></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '/patient',
    element: (
      <PermissionGuard roles={['PATIENT']}>
        <MainLayout />
      </PermissionGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <SuspenseWrapper><PatientDashboard /></SuspenseWrapper>,
      },
      {
        path: 'appointment',
        element: <SuspenseWrapper><div>我的预约</div></SuspenseWrapper>,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '*',
    element: (
      <div style={{ padding: 100, textAlign: 'center' }}>
        <h1>404 - 页面不存在</h1>
        <p>请检查您访问的地址是否正确</p>
      </div>
    ),
  },
]);

export default router;
