import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return (
        <div style={{ 
          padding: 100, 
          textAlign: 'center',
          color: '#666'
        }}>
          <h2>权限不足</h2>
          <p>您没有权限访问此页面</p>
        </div>
      );
    }
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
      } />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        
        <Route path="purchases" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PURCHASER', 'WAREHOUSE_KEEPER']}>
            <div className="page-header">
              <h2>采购管理</h2>
              <p>管理采购订单、收货和入库</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                采购管理功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="inventory/batches" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_KEEPER']}>
            <div className="page-header">
              <h2>库存批次</h2>
              <p>查看和管理所有库存批次</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                库存批次管理功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="inventory/alerts" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE_KEEPER', 'PHARMACIST']}>
            <div className="page-header">
              <h2>效期预警</h2>
              <p>查看药品效期预警信息</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                效期预警功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="prescriptions" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'CASHIER']}>
            <div className="page-header">
              <h2>处方管理</h2>
              <p>查看和审核处方</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                处方管理功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="sales/pos" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
            <div className="page-header">
              <h2>收银台</h2>
              <p>进行药品销售和收银</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                收银台功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="sales/list" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'CASHIER']}>
            <div className="page-header">
              <h2>销售记录</h2>
              <p>查看所有销售记录</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                销售记录功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="sales/recalls" element={
          <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
            <div className="page-header">
              <h2>药品召回</h2>
              <p>管理药品召回和通知</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                药品召回功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="drugs" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <div className="page-header">
              <h2>药品管理</h2>
              <p>管理药品基础信息</p>
            </div>
            <div className="form-container">
              <p style={{ color: '#999', textAlign: 'center' }}>
                药品管理功能 - 请确认后端服务已启动后使用
              </p>
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="*" element={
          <Navigate to="/" replace />
        } />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
