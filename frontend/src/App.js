import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectCreate from './pages/ProjectCreate';
import BiddingHall from './pages/BiddingHall';
import MyRegistrations from './pages/MyRegistrations';
import AuditDashboard from './pages/AuditDashboard';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(user?.role)) {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/projects" 
        element={
          <ProtectedRoute>
            <Layout>
              <Projects />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/projects/create" 
        element={
          <ProtectedRoute requiredRoles={['tenderer', 'supervisor']}>
            <Layout>
              <ProjectCreate />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/projects/:projectId/edit" 
        element={
          <ProtectedRoute requiredRoles={['tenderer', 'supervisor']}>
            <Layout>
              <ProjectCreate />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/bidding/:projectId" 
        element={
          <ProtectedRoute requiredRoles={['bidder', 'tenderer', 'supervisor']}>
            <Layout>
              <BiddingHall />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/my-registrations" 
        element={
          <ProtectedRoute requiredRoles={['bidder']}>
            <Layout>
              <MyRegistrations />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/my-bids" 
        element={
          <ProtectedRoute requiredRoles={['bidder']}>
            <Layout>
              <MyRegistrations />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/audit" 
        element={
          <ProtectedRoute requiredRoles={['auditor', 'supervisor']}>
            <Layout>
              <AuditDashboard />
            </Layout>
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
