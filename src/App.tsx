import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import AdminLayout from './components/layout/AdminLayout';
import MobileLayout from './components/layout/MobileLayout';
import PluginLayout from './components/layout/PluginLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import DashboardPage from './pages/admin/DashboardPage';
import ContentListPage from './pages/admin/ContentListPage';
import ContentCreatePage from './pages/admin/ContentCreatePage';
import AuditPage from './pages/admin/AuditPage';
import MobileHomePage from './pages/h5/HomePage';
import MobileContentPage from './pages/h5/ContentPage';
import MobileScenicPage from './pages/h5/ScenicPage';
import PluginDataWidgetPage from './pages/plugin/DataWidgetPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="content" element={<ContentListPage />} />
            <Route path="content/create" element={<ContentCreatePage />} />
            <Route path="content/:id" element={<div className="card"><h2 className="text-xl font-bold">内容详情页</h2><p className="text-ink-500 mt-2">内容详情功能开发中...</p></div>} />
            <Route path="content/:id/edit" element={<ContentCreatePage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="data/scenic" element={<div className="card"><h2 className="text-xl font-bold">景区客流</h2><p className="text-ink-500 mt-2">景区客流数据页面开发中...</p></div>} />
            <Route path="data/ota" element={<div className="card"><h2 className="text-xl font-bold">OTA数据</h2><p className="text-ink-500 mt-2">OTA预订数据页面开发中...</p></div>} />
            <Route path="data/heritage" element={<div className="card"><h2 className="text-xl font-bold">非遗名录</h2><p className="text-ink-500 mt-2">非遗名录页面开发中...</p></div>} />
            <Route path="data/coupon" element={<div className="card"><h2 className="text-xl font-bold">消费券核销</h2><p className="text-ink-500 mt-2">消费券核销页面开发中...</p></div>} />
            <Route path="dashboards" element={<div className="card"><h2 className="text-xl font-bold">数据看板</h2><p className="text-ink-500 mt-2">数据看板列表开发中...</p></div>} />
            <Route path="service/investment" element={<div className="card"><h2 className="text-xl font-bold">招商对接</h2><p className="text-ink-500 mt-2">招商对接页面开发中...</p></div>} />
            <Route path="service/festival" element={<div className="card"><h2 className="text-xl font-bold">节庆活动</h2><p className="text-ink-500 mt-2">节庆活动页面开发中...</p></div>} />
            <Route path="service/guide" element={<div className="card"><h2 className="text-xl font-bold">导游认证</h2><p className="text-ink-500 mt-2">导游认证页面开发中...</p></div>} />
            <Route path="analytics/propagation" element={<div className="card"><h2 className="text-xl font-bold">传播分析</h2><p className="text-ink-500 mt-2">传播分析页面开发中...</p></div>} />
            <Route path="analytics/sentiment" element={<div className="card"><h2 className="text-xl font-bold">舆情分析</h2><p className="text-ink-500 mt-2">舆情分析页面开发中...</p></div>} />
            <Route path="openapi" element={<div className="card"><h2 className="text-xl font-bold">API开放平台</h2><p className="text-ink-500 mt-2">API开放平台页面开发中...</p></div>} />
          </Route>

          <Route path="/h5" element={<MobileLayout />}>
            <Route index element={<MobileHomePage />} />
            <Route path="content" element={<MobileContentPage />} />
            <Route path="content/:id" element={<div className="bg-white rounded-xl p-4"><h2 className="font-bold text-lg mb-4">内容详情</h2><p className="text-ink-500">移动端内容详情开发中...</p></div>} />
            <Route path="scenic" element={<MobileScenicPage />} />
            <Route path="scenic/:id" element={<div className="bg-white rounded-xl p-4"><h2 className="font-bold text-lg mb-4">景区详情</h2><p className="text-ink-500">景区详情开发中...</p></div>} />
            <Route path="service" element={<div className="bg-white rounded-xl p-4"><h2 className="font-bold text-lg mb-4">便民服务</h2><p className="text-ink-500">服务页面开发中...</p></div>} />
            <Route path="profile" element={
              <ProtectedRoute>
                <div className="bg-white rounded-xl p-4"><h2 className="font-bold text-lg mb-4">个人中心</h2><p className="text-ink-500">个人中心开发中...</p></div>
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/plugin" element={<PluginLayout />}>
            <Route index element={<PluginDataWidgetPage />} />
            <Route path="data" element={<PluginDataWidgetPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
