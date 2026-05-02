import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import AppLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Plans from './pages/Plans';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Notifications from './pages/Notifications';
import Audit from './pages/Audit';

const ProtectedRoute = ({ children, requiredRoles = null, requiredPermissions = null }) => {
  const { isAuthenticated, hasRole, hasPermission, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner">加载中...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRoles && !requiredRoles.some(role => hasRole(role))) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredPermissions && !requiredPermissions.some(perm => hasPermission(perm))) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin, isOperator, isFinance, isTechLead } = useAuth();
  
  const isStaff = isAdmin() || isOperator() || isFinance() || isTechLead();
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to={isStaff ? "/dashboard" : "/plans"} replace /> : <Login />} 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={isStaff ? "/dashboard" : "/plans"} replace />} />
        
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'operator', 'finance', 'tech_lead']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="plans" element={<Plans />} />
        
        <Route path="subscriptions" element={<Subscriptions />} />
        
        <Route path="invoices" element={<Invoices />} />
        
        <Route path="notifications" element={<Notifications />} />
        
        <Route 
          path="audit" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'finance']}>
              <Audit />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
