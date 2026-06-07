import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Spin } from 'antd';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import AccountBalance from './pages/AccountBalance';
import AccountTransactions from './pages/AccountTransactions';
import AccountLoan from './pages/AccountLoan';
import WithdrawalApply from './pages/WithdrawalApply';
import WithdrawalList from './pages/WithdrawalList';
import WithdrawalApprove from './pages/WithdrawalApprove';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogs from './pages/AuditLogs';
import CenterConfig from './pages/CenterConfig';
import RiskAlerts from './pages/RiskAlerts';
import UnitDashboard from './pages/UnitDashboard';
import DeveloperDashboard from './pages/DeveloperDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="account/balance" element={
          <ProtectedRoute allowedRoles={['personal']}>
            <AccountBalance />
          </ProtectedRoute>
        } />
        <Route path="account/transactions" element={
          <ProtectedRoute allowedRoles={['personal']}>
            <AccountTransactions />
          </ProtectedRoute>
        } />
        <Route path="account/loan" element={
          <ProtectedRoute allowedRoles={['personal']}>
            <AccountLoan />
          </ProtectedRoute>
        } />
        <Route path="withdrawal/apply" element={
          <ProtectedRoute allowedRoles={['personal']}>
            <WithdrawalApply />
          </ProtectedRoute>
        } />
        <Route path="withdrawal/list" element={
          <ProtectedRoute allowedRoles={['personal']}>
            <WithdrawalList />
          </ProtectedRoute>
        } />
        <Route path="withdrawal/approve" element={
          <ProtectedRoute allowedRoles={['supervisor', 'super_admin']}>
            <WithdrawalApprove />
          </ProtectedRoute>
        } />
        <Route path="unit/dashboard" element={
          <ProtectedRoute allowedRoles={['unit_admin']}>
            <UnitDashboard />
          </ProtectedRoute>
        } />
        <Route path="developer/dashboard" element={
          <ProtectedRoute allowedRoles={['developer']}>
            <DeveloperDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/dashboard" element={
          <ProtectedRoute allowedRoles={['supervisor', 'super_admin', 'unit_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/audit" element={
          <ProtectedRoute allowedRoles={['supervisor', 'super_admin']}>
            <AuditLogs />
          </ProtectedRoute>
        } />
        <Route path="admin/config" element={
          <ProtectedRoute allowedRoles={['supervisor', 'super_admin']}>
            <CenterConfig />
          </ProtectedRoute>
        } />
        <Route path="admin/risk" element={
          <ProtectedRoute allowedRoles={['supervisor', 'super_admin']}>
            <RiskAlerts />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
