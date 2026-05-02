import { createBrowserRouter, Navigate, Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin, Result, Button } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import LivestockList from '@/pages/Livestock/List';
import LivestockAdmission from '@/pages/Livestock/Admission';
import LivestockDetail from '@/pages/Livestock/Detail';
import FeedingRecord from '@/pages/Feeding/Record';
import FeedingPlan from '@/pages/Feeding/Plan';
import VaccinationRecord from '@/pages/Vaccination/Record';
import VaccinationCalendar from '@/pages/Vaccination/Calendar';
import VaccinationCompliance from '@/pages/Vaccination/Compliance';
import { useUserStore } from '@/store/userStore';

const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" /></div>}>
    {children}
  </Suspense>
);

const PlaceholderPage = ({ title }: { title: string }) => {
  return (
    <Result
      status="info"
      title={title}
      subTitle="该页面正在开发中，敬请期待..."
      extra={
        <Link to="/">
          <Button type="primary">
            返回工作台
          </Button>
        </Link>
      }
    />
  );
};

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
        element: <Dashboard />,
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
            element: <LivestockList />,
          },
          {
            path: 'admission',
            element: <LivestockAdmission />,
          },
          {
            path: 'detail/:id',
            element: <LivestockDetail />,
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
            element: <FeedingRecord />,
          },
          {
            path: 'plan',
            element: <FeedingPlan />,
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
            element: <VaccinationRecord />,
          },
          {
            path: 'calendar',
            element: <VaccinationCalendar />,
          },
          {
            path: 'compliance',
            element: <VaccinationCompliance />,
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
            element: <PlaceholderPage title="出栏结算页面" />,
          },
          {
            path: 'profit',
            element: <PlaceholderPage title="毛利看板页面" />,
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
            element: <PlaceholderPage title="异常队列页面" />,
          },
          {
            path: 'health-check',
            element: <PlaceholderPage title="健康排查页面" />,
          },
          {
            path: 'history',
            element: <PlaceholderPage title="异常历史页面" />,
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
            element: <PlaceholderPage title="全场概览页面" />,
          },
          {
            path: 'production',
            element: <PlaceholderPage title="生产性能页面" />,
          },
          {
            path: 'cost',
            element: <PlaceholderPage title="成本毛利页面" />,
          },
          {
            path: 'anomaly',
            element: <PlaceholderPage title="异常监控页面" />,
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
            element: <PlaceholderPage title="用户管理页面" />,
          },
          {
            path: 'role',
            element: <PlaceholderPage title="角色权限页面" />,
          },
          {
            path: 'barn',
            element: <PlaceholderPage title="栏舍管理页面" />,
          },
          {
            path: 'settings',
            element: <PlaceholderPage title="系统设置页面" />,
          },
        ],
      },
    ],
  },
]);

export default router;
