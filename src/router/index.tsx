import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/Layout/MainLayout';
import ProtectedRoute from '../components/Layout/ProtectedRoute';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import PriceQuery from '../pages/PriceQuery';
import CargoPublish from '../pages/CargoPublish';
import CargoList from '../pages/CargoList';
import Orders from '../pages/Orders';
import Waybills from '../pages/Waybills';
import Tracking from '../pages/Tracking';
import Bills from '../pages/Bills';
import Settlement from '../pages/Settlement';
import Capacity from '../pages/Capacity';
import AuthCenter from '../pages/AuthCenter';
import type { UserRole } from '../../shared/types';

interface RouteMeta {
  title?: string;
  roles?: UserRole[];
}

const withProtected = (element: React.ReactNode, roles?: UserRole[]) => (
  <ProtectedRoute roles={roles}>{element}</ProtectedRoute>
);

export const routes = [
  {
    path: '/login',
    element: <Login />,
    meta: { title: '登录' } as RouteMeta,
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: withProtected(<Dashboard />),
        meta: { title: '首页' } as RouteMeta,
      },
      {
        path: 'price-query',
        element: withProtected(<PriceQuery />, ['owner', 'operator', 'admin']),
        meta: { title: '运价查询', roles: ['owner', 'operator', 'admin'] } as RouteMeta,
      },
      {
        path: 'cargo/publish',
        element: withProtected(<CargoPublish />, ['owner']),
        meta: { title: '发布货源', roles: ['owner'] } as RouteMeta,
      },
      {
        path: 'cargo/list',
        element: withProtected(<CargoList />),
        meta: { title: '货源列表' } as RouteMeta,
      },
      {
        path: 'orders',
        element: withProtected(<Orders />, ['owner', 'fleet', 'operator', 'admin']),
        meta: { title: '订单中心', roles: ['owner', 'fleet', 'operator', 'admin'] } as RouteMeta,
      },
      {
        path: 'waybills',
        element: withProtected(<Waybills />),
        meta: { title: '运单管理' } as RouteMeta,
      },
      {
        path: 'tracking',
        element: withProtected(<Tracking />, ['owner', 'fleet', 'operator', 'admin']),
        meta: { title: '在途监控', roles: ['owner', 'fleet', 'operator', 'admin'] } as RouteMeta,
      },
      {
        path: 'bills',
        element: withProtected(<Bills />, ['owner', 'fleet', 'operator', 'admin']),
        meta: { title: '账单管理', roles: ['owner', 'fleet', 'operator', 'admin'] } as RouteMeta,
      },
      {
        path: 'settlement',
        element: withProtected(<Settlement />, ['owner', 'fleet', 'operator', 'admin']),
        meta: { title: '结算中心', roles: ['owner', 'fleet', 'operator', 'admin'] } as RouteMeta,
      },
      {
        path: 'capacity',
        element: withProtected(<Capacity />, ['owner', 'fleet', 'operator', 'admin']),
        meta: { title: '运力管理', roles: ['owner', 'fleet', 'operator', 'admin'] } as RouteMeta,
      },
      {
        path: 'auth',
        element: withProtected(<AuthCenter />, ['owner', 'driver', 'fleet', 'operator', 'admin']),
        meta: { title: '认证中心', roles: ['owner', 'driver', 'fleet', 'operator', 'admin'] } as RouteMeta,
      },
    ],
  },
  {
    path: '/403',
    element: (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary-500 mb-4">403</h1>
          <p className="text-gray-500 mb-6">抱歉，您没有权限访问该页面</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    ),
  },
  {
    path: '/404',
    element: <NotFound />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
];

const router = createBrowserRouter(routes);

export default router;
