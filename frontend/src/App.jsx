import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import { ContractList, ContractDetail } from './pages/Contracts';
import { SigningList, SigningDetail } from './pages/Signing';
import Seals from './pages/Seals';
import LegalDashboard from './pages/Legal';

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

const LegalRoute = ({ children }) => {
  const { isLegalExpert, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!isLegalExpert) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="signing" element={<SigningList />} />
        <Route path="signing/:id" element={<SigningDetail />} />
        <Route path="seals" element={<Seals />} />
        <Route
          path="legal"
          element={
            <LegalRoute>
              <LegalDashboard />
            </LegalRoute>
          }
        />
        <Route
          path="legal/statistics"
          element={
            <LegalRoute>
              <LegalDashboard />
            </LegalRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
