import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Layout from './components/Layout';
import './index.css';

const ProtectedRoute = ({ children, requireRole = null }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
      <Route path="/cases/:caseId" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute requireRole="manager"><Users /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute requireRole="manager"><Audit /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1890ff' } }}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ConfigProvider>
  );
};

export default App;
