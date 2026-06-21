import { Component, lazy, Suspense, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import MainLayout from '@/layouts/MainLayout';

const PageLoader = (): ReactNode => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
    <Spin size="large">
      <span style={{ color: '#666', fontSize: 14 }}>页面加载中...</span>
    </Spin>
  </div>
);

const PlaceholderPage = ({ title }: { title: string }): ReactNode => (
  <div style={{ padding: 48, textAlign: 'center' }}>
    <h2 style={{ color: '#0F4C81', marginBottom: 16 }}>{title}</h2>
    <p style={{ color: '#666' }}>该页面组件正在开发中，敬请期待...</p>
  </div>
);

class ErrorBoundary extends Component<
  { children: ReactNode; title: string },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.title} 渲染错误:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 48 }}>
          <Result
            status="error"
            title={`${this.props.title} 加载失败`}
            subTitle={this.state.error?.message || '组件渲染时发生错误'}
            extra={[
              <Button
                key="retry"
                type="primary"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                刷新重试
              </Button>,
            ]}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

const createLazyPage = (
  factory: () => Promise<{ default: ComponentType }>,
  title: string
): (() => ReactNode) => {
  const LazyComponent = lazy(async () => {
    try {
      const mod = await factory();
      if (!mod || !mod.default) {
        console.warn(`[Router] ${title} 模块无默认导出，使用占位组件`);
        return { default: () => <PlaceholderPage title={title} /> };
      }
      return mod;
    } catch (err) {
      console.error(`[Router] ${title} 模块加载失败:`, err);
      return { default: () => <PlaceholderPage title={title} /> };
    }
  });

  return () => (
    <ErrorBoundary title={title}>
      <Suspense fallback={<PageLoader />}>
        <LazyComponent />
      </Suspense>
    </ErrorBoundary>
  );
};

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

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'landlord/audit', element: <AuditListPage /> },
      { path: 'landlord/audit/:id', element: <AuditDetailPage /> },
      { path: 'property/list', element: <PropertyListPage /> },
      { path: 'property/detail/:id', element: <PropertyDetailPage /> },
      { path: 'property/search', element: <PropertySearchPage /> },
      { path: 'contract/list', element: <ContractListPage /> },
      { path: 'contract/detail/:id', element: <ContractDetailPage /> },
      { path: 'credit/manage', element: <CreditManagePage /> },
      { path: 'service/workorder', element: <WorkOrderCenterPage /> },
      { path: 'service/emergency', element: <EmergencyCenterPage /> },
      { path: 'audit/logs', element: <AuditLogsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
];

export const router = createBrowserRouter(routes);
