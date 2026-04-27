import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import { useUserStore } from '@/store/userStore';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const LivestockList = lazy(() => import('@/pages/Livestock/List'));
const LivestockAdmission = lazy(() => import('@/pages/Livestock/Admission'));
const LivestockDetail = lazy(() => import('@/pages/Livestock/Detail'));
const FeedingRecord = lazy(() => import('@/pages/Feeding/Record'));
const FeedingPlan = lazy(() => import('@/pages/Feeding/Plan'));
const VaccinationRecord = lazy(() => import('@/pages/Vaccination/Record'));
const VaccinationCalendar = lazy(() => import('@/pages/Vaccination/Calendar'));
const VaccinationCompliance = lazy(() => import('@/pages/Vaccination/Compliance'));
const SettlementSlaughter = lazy(() => import('@/pages/Settlement/Slaughter'));
const SettlementProfit = lazy(() => import('@/pages/Settlement/ProfitBoard'));
const AnomalyQueue = lazy(() => import('@/pages/Anomaly/Queue'));
const AnomalyHealthCheck = lazy(() => import('@/pages/Anomaly/HealthCheck'));
const AnomalyHistory = lazy(() => import('@/pages/Anomaly/History'));
const StatisticsOverview = lazy(() => import('@/pages/Statistics/Overview'));
const StatisticsProduction = lazy(() => import('@/pages/Statistics/Production'));
const StatisticsCost = lazy(() => import('@/pages/Statistics/Cost'));
const StatisticsAnomaly = lazy(() => import('@/pages/Statistics/Anomaly'));
const SystemUser = lazy(() => import('@/pages/System/User'));
const SystemRole = lazy(() => import('@/pages/System/Role'));
const SystemBarn = lazy(() => import('@/pages/System/Barn'));
const SystemSettings = lazy(() => import('@/pages/System/Settings'));

const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>}>
    {children}
  </Suspense>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useUserStore.getState();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <LazyWrapper><Dashboard /></LazyWrapper>,
      },
      {
        path: 'livestock',
        children: [
          {
            index: true,
            element: <Navigate to="list" replace />,
          },
          {
            path: 'list',
            element: <LazyWrapper><LivestockList /></LazyWrapper>,
          },
          {
            path: 'admission',
            element: <LazyWrapper><LivestockAdmission /></LazyWrapper>,
          },
          {
            path: 'detail/:id',
            element: <LazyWrapper><LivestockDetail /></LazyWrapper>,
          },
        ],
      },
      {
        path: 'feeding',
        children: [
          {
            index: true,
            element: <Navigate to="record" replace />,
          },
          {
            path: 'record',
            element: <LazyWrapper><FeedingRecord /></LazyWrapper>,
          },
          {
            path: 'plan',
            element: <LazyWrapper><FeedingPlan /></LazyWrapper>,
          },
        ],
      },
      {
        path: 'vaccination',
        children: [
          {
            index: true,
            element: <Navigate to="record" replace />,
          },
          {
            path: 'record',
            element: <LazyWrapper><VaccinationRecord /></LazyWrapper>,
          },
          {
            path: 'calendar',
            element: <LazyWrapper><VaccinationCalendar /></LazyWrapper>,
          },
          {
            path: 'compliance',
            element: <LazyWrapper><VaccinationCompliance /></LazyWrapper>,
          },
        ],
      },
      {
        path: 'settlement',
        children: [
          {
            index: true,
            element: <Navigate to="slaughter" replace />,
          },
          {
            path: 'slaughter',
            element: <LazyWrapper><SettlementSlaughter /></LazyWrapper>,
          },
          {
            path: 'profit',
            element: <LazyWrapper><SettlementProfit /></LazyWrapper>,
          },
        ],
      },
      {
        path: 'anomaly',
        children: [
          {
            index: true,
            element: <Navigate to="queue" replace />,
          },
          {
            path: 'queue',
            element: <LazyWrapper><AnomalyQueue /></LazyWrapper>,
          },
          {
            path: 'health-check',
            element: <LazyWrapper><AnomalyHealthCheck /></LazyWrapper>,
          },
          {
            path: 'history',
            element: <LazyWrapper><AnomalyHistory /></LazyWrapper>,
          },
        ],
      },
      {
        path: 'statistics',
        children: [
          {
            index: true,
            element: <Navigate to="overview" replace />,
          },
          {
            path: 'overview',
            element: <LazyWrapper><StatisticsOverview /></LazyWrapper>,
          },
          {
            path: 'production',
            element: <LazyWrapper><StatisticsProduction /></LazyWrapper>,
          },
          {
            path: 'cost',
            element: <LazyWrapper><StatisticsCost /></LazyWrapper>,
          },
          {
            path: 'anomaly',
            element: <LazyWrapper><StatisticsAnomaly /></LazyWrapper>,
          },
        ],
      },
      {
        path: 'system',
        children: [
          {
            index: true,
            element: <Navigate to="user" replace />,
          },
          {
            path: 'user',
            element: <LazyWrapper><SystemUser /></LazyWrapper>,
          },
          {
            path: 'role',
            element: <LazyWrapper><SystemRole /></LazyWrapper>,
          },
          {
            path: 'barn',
            element: <LazyWrapper><SystemBarn /></LazyWrapper>,
          },
          {
            path: 'settings',
            element: <LazyWrapper><SystemSettings /></LazyWrapper>,
          },
        ],
      },
    ],
  },
]);

export default router;
