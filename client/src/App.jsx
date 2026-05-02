import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import Login from './pages/Login';
import MainLayout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Bills from './pages/Bills';
import Endorsements from './pages/Endorsements';
import Discounts from './pages/Discounts';
import Maturities from './pages/Maturities';
import Differences from './pages/Differences';

dayjs.locale('zh-cn');

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/bills" element={
        <PrivateRoute>
          <MainLayout>
            <Bills />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/endorsements" element={
        <PrivateRoute>
          <MainLayout>
            <Endorsements />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/discounts" element={
        <PrivateRoute>
          <MainLayout>
            <Discounts />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/maturities" element={
        <PrivateRoute>
          <MainLayout>
            <Maturities />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="/differences" element={
        <PrivateRoute>
          <MainLayout>
            <Differences />
          </MainLayout>
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
