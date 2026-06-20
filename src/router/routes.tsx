import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute, GuestRoute } from './ProtectedRoute';

const Login = lazy(() => import('@/pages/Login'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const CommunityList = lazy(() => import('@/pages/Community/List'));
const CommunityDetail = lazy(() => import('@/pages/Community/Detail'));
const WorkOrderList = lazy(() => import('@/pages/WorkOrder/List'));
const WorkOrderDetail = lazy(() => import('@/pages/WorkOrder/Detail'));
const WorkOrderCreate = lazy(() => import('@/pages/WorkOrder/Create'));
const MallHome = lazy(() => import('@/pages/Mall/Home'));
const ProductDetail = lazy(() => import('@/pages/Mall/ProductDetail'));
const OrderList = lazy(() => import('@/pages/Mall/OrderList'));
const MerchantDashboard = lazy(() => import('@/pages/Mall/Merchant'));
const ActivityList = lazy(() => import('@/pages/Activity/List'));
const ActivityDetail = lazy(() => import('@/pages/Activity/Detail'));
const FinanceProducts = lazy(() => import('@/pages/Finance/Products'));
const HealthRecord = lazy(() => import('@/pages/Health/Record'));
const HealthDetail = lazy(() => import('@/pages/Health/Detail'));
const PaymentCenter = lazy(() => import('@/pages/Payment/Center'));
const PaymentDetail = lazy(() => import('@/pages/Payment/Detail'));
const SettingsRoles = lazy(() => import('@/pages/Settings/Roles'));
const CommitteeReview = lazy(() => import('@/pages/Committee/Review'));
const Profile = lazy(() => import('@/pages/Profile'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-neutral-500 text-sm">加载中...</span>
    </div>
  </div>
);

const withSuspense = (component: React.ReactNode) => (
  <Suspense fallback={<LoadingFallback />}>{component}</Suspense>
);

export const routes = [
  {
    path: '/login',
    element: (
      <GuestRoute>
        {withSuspense(<Login />)}
      </GuestRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: withSuspense(<Dashboard />) },

      { path: 'community', element: withSuspense(<CommunityList />) },
      { path: 'community/:id', element: withSuspense(<CommunityDetail />) },

      { path: 'work-order', element: withSuspense(<WorkOrderList />) },
      { path: 'work-order/:id', element: withSuspense(<WorkOrderDetail />) },
      { path: 'work-order/create', element: withSuspense(<WorkOrderCreate />) },

      { path: 'mall', element: withSuspense(<MallHome />) },
      { path: 'mall/products', element: withSuspense(<MallHome />) },
      { path: 'mall/product/:id', element: withSuspense(<ProductDetail />) },
      { path: 'mall/orders', element: withSuspense(<OrderList />) },
      { path: 'mall/merchant', element: withSuspense(<MerchantDashboard />) },

      { path: 'activity', element: withSuspense(<ActivityList />) },
      { path: 'activity/:id', element: withSuspense(<ActivityDetail />) },

      { path: 'finance', element: withSuspense(<FinanceProducts />) },

      { path: 'health', element: withSuspense(<HealthRecord />) },
      { path: 'health/:id', element: withSuspense(<HealthDetail />) },

      { path: 'payment', element: withSuspense(<PaymentCenter />) },
      { path: 'payment/:id', element: withSuspense(<PaymentDetail />) },

      { path: 'settings/roles', element: withSuspense(<SettingsRoles />) },

      { path: 'committee/review', element: withSuspense(<CommitteeReview />) },

      { path: 'profile', element: withSuspense(<Profile />) },
    ],
  },
  {
    path: '/403',
    element: (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary-500 mb-4">403</h1>
          <p className="text-neutral-400 mb-6">抱歉，您没有权限访问此页面</p>
          <button className="btn-primary" onClick={() => window.history.back()}>返回上一页</button>
        </div>
      </div>
    ),
  },
  {
    path: '*',
    element: (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
          <p className="text-neutral-400 mb-6">抱歉，您访问的页面不存在</p>
          <button className="btn-primary" onClick={() => (window.location.href = '/dashboard')}>返回首页</button>
        </div>
      </div>
    ),
  },
];
