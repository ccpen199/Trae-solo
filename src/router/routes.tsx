import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import BasicLayout from '@/layouts/BasicLayout';
import BlankLayout from '@/layouts/BlankLayout';
import AuthGuard from './guard';

const Login = lazy(() => import('@/pages/login'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const NotFound = lazy(() => import('@/pages/404'));
const PlaceList = lazy(() => import('@/pages/places'));
const PlaceDetail = lazy(() => import('@/pages/places/detail'));
const PlaceCreate = lazy(() => import('@/pages/places/create'));
const PlaceEdit = lazy(() => import('@/pages/places/edit'));
const VerificationPage = lazy(() => import('@/pages/verification'));
const ReservationPage = lazy(() => import('@/pages/reservation'));
const ReservationConfigPage = lazy(() => import('@/pages/reservation/config'));
const AlarmList = lazy(() => import('@/pages/alarms'));
const AlarmDetail = lazy(() => import('@/pages/alarms/detail'));
const InspectionList = lazy(() => import('@/pages/inspection'));
const InspectionCreate = lazy(() => import('@/pages/inspection/create'));
const InspectionDetail = lazy(() => import('@/pages/inspection/detail'));
const AnalyticsPage = lazy(() => import('@/pages/analytics'));
const ReportsPage = lazy(() => import('@/pages/analytics/reports'));
const UserManagement = lazy(() => import('@/pages/system/users'));
const RoleManagement = lazy(() => import('@/pages/system/roles'));
const LogAudit = lazy(() => import('@/pages/system/logs'));
const SecurityConfigPage = lazy(() => import('@/pages/system/security'));
const ProfilePage = lazy(() => import('@/pages/profile'));

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  permissions?: string[];
  roles?: string[];
  hidden?: boolean;
  icon?: string;
}

export interface AppRouteObject {
  path?: string;
  index?: boolean;
  element?: React.ReactNode;
  meta?: RouteMeta;
  children?: AppRouteObject[];
}

const withAuth = (element: React.ReactNode) => <AuthGuard>{element}</AuthGuard>;

export const publicRoutes: AppRouteObject[] = [
  {
    path: '/login',
    element: <Login />,
    meta: { title: '登录', requiresAuth: false },
  },
];

export const protectedRoutes: AppRouteObject[] = [
  {
    element: <BasicLayout />,
    meta: { requiresAuth: true },
    children: [
      {
        index: true,
        element: withAuth(<Dashboard />),
        meta: { title: '监管大屏', icon: 'dashboard' },
      },
      {
        path: '/dashboard',
        element: withAuth(<Dashboard />),
        meta: { title: '监管大屏', icon: 'dashboard' },
      },
      {
        path: '/places',
        meta: { title: '场所备案管理', icon: 'place', requiresAuth: true },
        children: [
          {
            index: true,
            element: withAuth(<PlaceList />),
            meta: { title: '场所列表' },
          },
          {
            path: 'create',
            element: withAuth(<PlaceCreate />),
            meta: { title: '新增备案', permissions: ['place:create'], hidden: true },
          },
          {
            path: 'detail/:id',
            element: withAuth(<PlaceDetail />),
            meta: { title: '场所详情', hidden: true },
          },
          {
            path: 'edit/:id',
            element: withAuth(<PlaceEdit />),
            meta: { title: '编辑场所', permissions: ['place:edit'], hidden: true },
          },
        ],
      },
      {
        path: '/verification',
        meta: { title: '实名核验管理', icon: 'verification', requiresAuth: true },
        children: [
          {
            index: true,
            element: withAuth(<VerificationPage />),
            meta: { title: '核验记录' },
          },
        ],
      },
      {
        path: '/reservation',
        meta: { title: '预约分流管理', icon: 'reservation', requiresAuth: true },
        children: [
          {
            index: true,
            element: withAuth(<ReservationPage />),
            meta: { title: '预约记录' },
          },
          {
            path: 'config',
            element: withAuth(<ReservationConfigPage />),
            meta: { title: '预约配置' },
          },
        ],
      },
      {
        path: '/alarms',
        meta: { title: 'AI告警中心', icon: 'alarm', requiresAuth: true },
        children: [
          {
            index: true,
            element: withAuth(<AlarmList />),
            meta: { title: '告警列表' },
          },
          {
            path: ':id',
            element: withAuth(<AlarmDetail />),
            meta: { title: '告警详情', hidden: true },
          },
        ],
      },
      {
        path: '/inspection',
        meta: { title: '巡检任务管理', icon: 'inspection', requiresAuth: true },
        children: [
          {
            index: true,
            element: withAuth(<InspectionList />),
            meta: { title: '任务列表' },
          },
          {
            path: 'create',
            element: withAuth(<InspectionCreate />),
            meta: { title: '创建任务', permissions: ['inspection:create'] },
          },
          {
            path: ':id',
            element: withAuth(<InspectionDetail />),
            meta: { title: '任务详情', hidden: true },
          },
        ],
      },
      {
        path: '/analytics',
        meta: { title: '经营数据分析', icon: 'analytics', requiresAuth: true },
        children: [
          {
            index: true,
            element: withAuth(<AnalyticsPage />),
            meta: { title: '数据分析' },
          },
          {
            path: 'reports',
            element: withAuth(<ReportsPage />),
            meta: { title: '数据上报' },
          },
        ],
      },
      {
        path: '/system',
        meta: { title: '系统管理', icon: 'system', requiresAuth: true, roles: ['system_admin', 'province_admin'] },
        children: [
          {
            path: 'users',
            element: withAuth(<UserManagement />),
            meta: { title: '用户管理', icon: 'user' },
          },
          {
            path: 'roles',
            element: withAuth(<RoleManagement />),
            meta: { title: '角色权限', icon: 'role' },
          },
          {
            path: 'logs',
            element: withAuth(<LogAudit />),
            meta: { title: '日志审计', icon: 'log' },
          },
          {
            path: 'security',
            element: withAuth(<SecurityConfigPage />),
            meta: { title: '等保配置', icon: 'security' },
          },
        ],
      },
      {
        path: '/profile',
        element: withAuth(<ProfilePage />),
        meta: { title: '个人中心', hidden: true },
      },
    ],
  },
];

export const routes: AppRouteObject[] = [
  ...publicRoutes,
  ...protectedRoutes,
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
