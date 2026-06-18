import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getRoleRedirectPath } from '@/mock/auth';

import ResidentLayout from '@/components/layout/ResidentLayout';
import PropertyLayout from '@/components/layout/PropertyLayout';
import AdminLayout from '@/components/layout/AdminLayout';

import LoginPage from '@/pages/LoginPage';
import HomePage from '@/pages/resident/HomePage';
import TopicsPage from '@/pages/resident/TopicsPage';
import TopicDetailPage from '@/pages/resident/TopicDetailPage';
import CreateTopicPage from '@/pages/resident/CreateTopicPage';
import ProductsPage from '@/pages/resident/ProductsPage';
import ProductDetailPage from '@/pages/resident/ProductDetailPage';
import SecondhandPage from '@/pages/resident/SecondhandPage';
import SecondhandDetailPage from '@/pages/resident/SecondhandDetailPage';
import WalletPage from '@/pages/resident/WalletPage';
import TasksPage from '@/pages/resident/TasksPage';
import PartnerPage from '@/pages/resident/PartnerPage';
import PropertyPage from '@/pages/resident/PropertyPage';
import OrdersPage from '@/pages/resident/OrdersPage';

import DashboardPage from '@/pages/admin/DashboardPage';
import CommunityHealthPage from '@/pages/admin/CommunityHealthPage';
import TraceLogPage from '@/pages/admin/TraceLogPage';
import RiskControlPage from '@/pages/admin/RiskControlPage';

function AuthInitializer() {
  const { loadFromStorage, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      loadFromStorage();
    }
  }, [loadFromStorage, isHydrated]);

  return null;
}

function LoadingScreen({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-emerald-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    </div>
  );
}

function LoginRedirect() {
  const { isAuthenticated, user, isHydrated, isLoading } = useAuthStore();
  const location = useLocation();

  if (!isHydrated || isLoading) {
    return <LoadingScreen text="正在校验身份..." />;
  }

  if (isAuthenticated && user) {
    const redirectPath = getRoleRedirectPath(user.role);
    const from = (location.state as { from?: string })?.from;
    return <Navigate to={from || redirectPath} replace />;
  }

  return <LoginPage />;
}

function ProtectedRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const { isAuthenticated, user, isHydrated, isLoading } = useAuthStore();
  const location = useLocation();

  if (!isHydrated || isLoading) {
    return <LoadingScreen text="正在加载工作台..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    const redirectPath = getRoleRedirectPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

function PropertyPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
        <p className="text-sm text-gray-400 mt-2">功能开发中...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/register" element={<LoginRedirect />} />

      <Route
        path="/"
        element={
          <ProtectedRoute requiredRoles={['resident', 'tenant_admin', 'platform_admin', 'property_admin', 'property_staff']}>
            <ResidentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="topics/create" element={<CreateTopicPage />} />
        <Route path="topics/:id" element={<TopicDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="secondhand" element={<SecondhandPage />} />
        <Route path="secondhand/:id" element={<SecondhandDetailPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="partner" element={<PartnerPage />} />
        <Route path="property" element={<PropertyPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>

      <Route
        path="/property"
        element={
          <ProtectedRoute requiredRoles={['property_admin', 'property_staff', 'platform_admin', 'tenant_admin']}>
            <PropertyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/property/dashboard" replace />} />
        <Route path="dashboard" element={<PropertyPlaceholder title="物业工作台" />} />
        <Route path="residents" element={<PropertyPlaceholder title="住户管理" />} />
        <Route path="access-control" element={<PropertyPlaceholder title="门禁管理" />} />
        <Route path="bills" element={<PropertyPlaceholder title="缴费管理" />} />
        <Route path="repairs" element={<PropertyPlaceholder title="报修管理" />} />
        <Route path="complaints" element={<PropertyPlaceholder title="投诉管理" />} />
        <Route path="notifications" element={<PropertyPlaceholder title="通知管理" />} />
        <Route path="settings" element={<PropertyPlaceholder title="系统设置" />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={['platform_admin', 'tenant_admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="community-health" element={<CommunityHealthPage />} />
        <Route path="trace-logs" element={<TraceLogPage />} />
        <Route path="transactions" element={<PropertyPlaceholder title="交易管理" />} />
        <Route path="risk-control" element={<RiskControlPage />} />
        <Route path="partners" element={<PropertyPlaceholder title="合伙人管理" />} />
        <Route path="property-integration" element={<PropertyPlaceholder title="物业对接" />} />
        <Route path="system-settings" element={<PropertyPlaceholder title="系统设置" />} />
      </Route>

      <Route
        path="*"
        element={
          isAuthenticated && user ? (
            <Navigate to={getRoleRedirectPath(user.role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <AuthInitializer />
      <AppRoutes />
    </>
  );
}
