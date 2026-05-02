import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { wsService } from './websocket';

import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import InvestorDashboard from './pages/InvestorDashboard';
import TradePage from './pages/TradePage';
import OrdersPage from './pages/OrdersPage';
import PositionsPage from './pages/PositionsPage';
import FundsPage from './pages/FundsPage';
import ReportsPage from './pages/ReportsPage';
import RiskDashboard from './pages/RiskDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FinancialDashboard from './pages/FinancialDashboard';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role}/dashboard`} replace />;
};

const App = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect();
    }

    return () => {
      wsService.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardRedirect />} />
          
          <Route path="investor/dashboard" element={
            <ProtectedRoute allowedRoles={['investor']}>
              <InvestorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="trade" element={
            <ProtectedRoute allowedRoles={['investor']}>
              <TradePage />
            </ProtectedRoute>
          } />
          
          <Route path="orders" element={
            <ProtectedRoute allowedRoles={['investor', 'risk_officer', 'exchange_admin']}>
              <OrdersPage />
            </ProtectedRoute>
          } />
          
          <Route path="positions" element={
            <ProtectedRoute allowedRoles={['investor']}>
              <PositionsPage />
            </ProtectedRoute>
          } />
          
          <Route path="funds" element={
            <ProtectedRoute allowedRoles={['investor']}>
              <FundsPage />
            </ProtectedRoute>
          } />
          
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={['investor']}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          
          <Route path="risk-officer/dashboard" element={
            <ProtectedRoute allowedRoles={['risk_officer']}>
              <RiskDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="risk/logs" element={
            <ProtectedRoute allowedRoles={['risk_officer', 'exchange_admin']}>
              <RiskDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="exchange-admin/dashboard" element={
            <ProtectedRoute allowedRoles={['exchange_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="market" element={
            <ProtectedRoute allowedRoles={['exchange_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="users" element={
            <ProtectedRoute allowedRoles={['exchange_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="audit" element={
            <ProtectedRoute allowedRoles={['exchange_admin', 'risk_officer', 'financial_settler']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="financial-settler/dashboard" element={
            <ProtectedRoute allowedRoles={['financial_settler']}>
              <FinancialDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="settlement/reports" element={
            <ProtectedRoute allowedRoles={['financial_settler', 'exchange_admin']}>
              <FinancialDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="funds/all" element={
            <ProtectedRoute allowedRoles={['financial_settler', 'exchange_admin']}>
              <FinancialDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="positions/all" element={
            <ProtectedRoute allowedRoles={['financial_settler', 'exchange_admin']}>
              <FinancialDashboard />
            </ProtectedRoute>
          } />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
