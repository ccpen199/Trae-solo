import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/layouts/MainLayout';

// 页面加载时的占位组件
const PageLoader = (): ReactNode => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large" tip="页面加载中..." />
  </div>
);

// 页面占位组件(组件未创建时使用)
const PlaceholderPage = ({ title }: { title: string }): ReactNode => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2 style={{ color: '#0F4C81', marginBottom: 16 }}>{title}</h2>
    <p style={{ color: '#666' }}>该页面组件正在开发中，敬请期待...</p>
  </div>
);

// 安全懒加载: 如果页面组件不存在则使用占位组件
const createLazyPage = (
  factory: () => Promise<{ default: ComponentType }>,
  title: string
): (() => ReactNode) => {
  const LazyComponent = lazy(async () => {
    try {
      return await factory();
    } catch {
      return {
        default: () => <PlaceholderPage title={title} />,
      };
    }
  });

  return () => (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent />
    </Suspense>
  );
};

// 懒加载各页面组件
const DashboardPage = createLazyPage(() => import('@/pages/Dashboard/Dashboard'), '运营数据看板');
const AuditListPage = createLazyPage(() => import('@/pages/Landlord/AuditList'), '房东审核列表');
const AuditDetailPage = createLazyPage(() => import('@/pages/Landlord/AuditDetail'), '房东审核详情');
const PropertyListPage = createLazyPage(() => import('@/pages/Property/PropertyList'), '房源列表');
const PropertyDetailPage = createLazyPage(() => import('@/pages/Property/PropertyDetail'), '房源详情');
const PropertySearchPage = createLazyPage(() => import('@/pages/Property/PropertySearch'), '房源搜索');
const ContractListPage = createLazyPage(() => import('@/pages/Contract/ContractList'), '合同列表');
const ContractDetailPage = createLazyPage(() => import('@/pages/Contract/ContractDetail'), '合同详情');
const CreditManagePage = createLazyPage(() => import('@/pages/Credit/CreditManage'), '信用管理');
const WorkOrderCenterPage = createLazyPage(() => import('@/pages/Service/WorkOrderCenter'), '工单中心');
const EmergencyCenterPage = createLazyPage(() => import('@/pages/Service/EmergencyCenter'), '应急安置中心');
const AuditLogsPage = createLazyPage(() => import('@/pages/Audit/AuditLogs'), '审计日志');

// 路由配置表 (嵌套在 MainLayout 下)
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'landlord/audit',
        element: <AuditListPage />,
      },
      {
        path: 'landlord/audit/:id',
        element: <AuditDetailPage />,
      },
      {
        path: 'property/list',
        element: <PropertyListPage />,
      },
      {
        path: 'property/detail/:id',
        element: <PropertyDetailPage />,
      },
      {
        path: 'property/search',
        element: <PropertySearchPage />,
      },
      {
        path: 'contract/list',
        element: <ContractListPage />,
      },
      {
        path: 'contract/detail/:id',
        element: <ContractDetailPage />,
      },
      {
        path: 'credit/manage',
        element: <CreditManagePage />,
      },
      {
        path: 'service/workorder',
        element: <WorkOrderCenterPage />,
      },
      {
        path: 'service/emergency',
        element: <EmergencyCenterPage />,
      },
      {
        path: 'audit/logs',
        element: <AuditLogsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];

// 创建路由实例
export const router = createBrowserRouter(routes);
