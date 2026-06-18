import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
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
          <ProtectedRoute>
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
