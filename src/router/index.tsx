import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const NurseList = lazy(() => import('@/pages/NurseList'));
const NurseVerify = lazy(() => import('@/pages/NurseVerify'));
const OrderList = lazy(() => import('@/pages/OrderList'));
const OrderDetail = lazy(() => import('@/pages/OrderDetail'));
const RiskAssessment = lazy(() => import('@/pages/RiskAssessment'));
const ServiceOngoing = lazy(() => import('@/pages/ServiceOngoing'));
const ServiceRecord = lazy(() => import('@/pages/ServiceRecord'));
const AuditTodo = lazy(() => import('@/pages/AuditTodo'));
const AuditWorkbench = lazy(() => import('@/pages/AuditWorkbench'));
const RiskTicketList = lazy(() => import('@/pages/RiskTicketList'));
const RiskTicketDetail = lazy(() => import('@/pages/RiskTicketDetail'));
const InsuranceList = lazy(() => import('@/pages/InsuranceList'));
const InsuranceConfig = lazy(() => import('@/pages/InsuranceConfig'));
const Reports = lazy(() => import('@/pages/Reports'));

const LazyWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>}>
    {children}
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <LazyWrapper><Dashboard /></LazyWrapper> },
      { path: 'nurses', element: <LazyWrapper><NurseList /></LazyWrapper> },
      { path: 'nurses/:id/verify', element: <LazyWrapper><NurseVerify /></LazyWrapper> },
      { path: 'orders', element: <LazyWrapper><OrderList /></LazyWrapper> },
      { path: 'orders/:id', element: <LazyWrapper><OrderDetail /></LazyWrapper> },
      { path: 'orders/:id/risk-assessment', element: <LazyWrapper><RiskAssessment /></LazyWrapper> },
      { path: 'service/ongoing', element: <LazyWrapper><ServiceOngoing /></LazyWrapper> },
      { path: 'service/:id/record', element: <LazyWrapper><ServiceRecord /></LazyWrapper> },
      { path: 'audit/todo', element: <LazyWrapper><AuditTodo /></LazyWrapper> },
      { path: 'audit/:id', element: <LazyWrapper><AuditWorkbench /></LazyWrapper> },
      { path: 'risk/tickets', element: <LazyWrapper><RiskTicketList /></LazyWrapper> },
      { path: 'risk/tickets/:id', element: <LazyWrapper><RiskTicketDetail /></LazyWrapper> },
      { path: 'insurance/policies', element: <LazyWrapper><InsuranceList /></LazyWrapper> },
      { path: 'insurance/config', element: <LazyWrapper><InsuranceConfig /></LazyWrapper> },
      { path: 'reports/*', element: <LazyWrapper><Reports /></LazyWrapper> },
    ],
  },
]);

export default router;
