import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import AssignPage from './pages/Assign';
import ReviewPage from './pages/Review';
import ItemsPage from './pages/Items';
import TemplatesPage from './pages/Templates';
import TrackingPage from './pages/Tracking';
import EvidencePage from './pages/Evidence';
import SystemPage from './pages/System';
import AdminLayout from './components/AdminLayout';
import { useAdminStore } from './store/adminStore';

const ProtectedRoute: React.FC = () => {
  const token = useAdminStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
};

const App: React.FC = () => (
  <ConfigProvider
    locale={zhCN}
    theme={{
      token: {
        colorPrimary: '#1E5DAB',
        colorInfo: '#1E5DAB',
        colorLink: '#1E5DAB',
        borderRadius: 8,
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 14
      },
      components: {
        Layout: { headerBg: '#fff', siderBg: '#001529' },
        Menu: { darkItemBg: 'transparent' }
      }
    }}>
    <AntdApp>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/assign" element={<AssignPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/items" element={<ItemsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/system" element={<SystemPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AntdApp>
  </ConfigProvider>
);

export default App;
