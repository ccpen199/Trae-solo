import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ConfigsPage from './pages/ConfigsPage';
import TasksPage from './pages/TasksPage';
import LogsPage from './pages/LogsPage';
import ChangeOrdersPage from './pages/ChangeOrdersPage';
import AlertsPage from './pages/AlertsPage';
import AuditPage from './pages/AuditPage';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, user, hasRole } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRoles && !hasRole(requiredRoles)) {
    return <div style={{ padding: 40, textAlign: 'center' }}>无权限访问此页面</div>;
  }
  
  return children;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/applications" element={
        <ProtectedRoute>
          <ApplicationsPage />
        </ProtectedRoute>
      } />
      <Route path="/configs" element={
        <ProtectedRoute>
          <ConfigsPage />
        </ProtectedRoute>
      } />
      <Route path="/tasks" element={
        <ProtectedRoute>
          <TasksPage />
        </ProtectedRoute>
      } />
      <Route path="/logs" element={
        <ProtectedRoute>
          <LogsPage />
        </ProtectedRoute>
      } />
      <Route path="/change-orders" element={
        <ProtectedRoute>
          <ChangeOrdersPage />
        </ProtectedRoute>
      } />
      <Route path="/alerts" element={
        <ProtectedRoute>
          <AlertsPage />
        </ProtectedRoute>
      } />
      <Route path="/audit" element={
        <ProtectedRoute requiredRoles={['security_admin', 'platform_engineer']}>
          <AuditPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
