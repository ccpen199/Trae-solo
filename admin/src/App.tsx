import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAdminStore } from './store/adminStore';
import ServiceProvider from './pages/service/ServiceProvider';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TaskManage from './pages/TaskManage';
import TaskROI from './pages/TaskROI';
import UserManage from './pages/UserManage';
import WithdrawalAudit from './pages/WithdrawalAudit';
import RiskCenter from './pages/RiskCenter';
import AdConfig from './pages/AdConfig';
import PermissionDenied from './pages/service/PermissionDenied';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAdminStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#ff6b35' } }}>
      <AntdApp>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ServiceProvider>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/tasks" element={<TaskManage />} />
                      <Route path="/task-roi" element={<TaskROI />} />
                      <Route path="/users" element={<UserManage />} />
                      <Route path="/withdrawals" element={<WithdrawalAudit />} />
                      <Route path="/risk" element={<RiskCenter />} />
                      <Route path="/ads" element={<AdConfig />} />
                      <Route path="/403" element={<PermissionDenied />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ServiceProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
