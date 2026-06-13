import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { authAPI } from './services/api';
import { useAuthStore } from './store';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import DeviceListPage from './pages/devices/DeviceList';
import DeviceDetailPage from './pages/devices/DeviceDetail';
import SceneListPage from './pages/scenes/SceneList';
import SceneEditPage from './pages/scenes/SceneEdit';
import SceneBuilderPage from './pages/scenes/SceneBuilder';
import VoiceControlPage from './pages/voice/VoiceControl';
import AlertListPage from './pages/alerts/AlertList';
import OtaManagementPage from './pages/ota/OtaManagement';
import ShareManagementPage from './pages/share/ShareManagement';
import AnalyticsPage from './pages/analytics/Analytics';
import LearningPage from './pages/analytics/Learning';
import VendorManagementPage from './pages/admin/VendorManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import HomeManagementPage from './pages/HomeManagement';
import ProfilePage from './pages/Profile';
import NotFoundPage from './pages/NotFound';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="devices" element={<DeviceListPage />} />
        <Route path="devices/:id" element={<DeviceDetailPage />} />
        <Route path="scenes" element={<SceneListPage />} />
        <Route path="scenes/:id" element={<SceneEditPage />} />
        <Route path="scenes/builder" element={<SceneBuilderPage />} />
        <Route path="voice" element={<VoiceControlPage />} />
        <Route path="alerts" element={<AlertListPage />} />
        <Route path="ota" element={<OtaManagementPage />} />
        <Route path="share" element={<ShareManagementPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="homes" element={<HomeManagementPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/vendors" element={<VendorManagementPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
