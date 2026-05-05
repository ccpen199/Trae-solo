import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout';

const LoginPage = lazy(() => import('./pages/Login'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const MaterialsPage = lazy(() => import('./pages/Materials'));
const SuppliersPage = lazy(() => import('./pages/Suppliers'));

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
    <Spin size="large" />
  </div>
);

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Navigate to="/dashboard" replace />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <MainLayout>
                <MaterialsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SuppliersPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>客户管理</h2></div>
                <p>客户管理功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/warehouses"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>仓库管理</h2></div>
                <p>仓库管理功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>库存查询</h2></div>
                <p>库存查询功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-in"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>入库管理</h2></div>
                <p>入库管理功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock-out"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>出库管理</h2></div>
                <p>出库管理功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-orders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>采购订单</h2></div>
                <p>采购订单功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/purchase-settlements"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>采购结算</h2></div>
                <p>采购结算功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-orders"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>销售订单</h2></div>
                <p>销售订单功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-payables"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>应付账款</h2></div>
                <p>应付账款功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account-receivables"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>应收账款</h2></div>
                <p>应收账款功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>人事管理</h2></div>
                <p>人事管理功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <MainLayout>
                <div className="page-header"><h2>用户管理</h2></div>
                <p>用户管理功能开发中...</p>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
