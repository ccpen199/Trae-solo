import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spin } from 'antd';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import HouseholdList from './pages/HouseholdList';
import HouseholdDetail from './pages/HouseholdDetail';
import HouseholdSearch from './pages/HouseholdSearch';
import UserManagement from './pages/UserManagement';
import OperationLogs from './pages/OperationLogs';
import PasswordChange from './pages/PasswordChange';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, token, loading, checkPermission } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !checkPermission(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (token && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="households" element={<HouseholdList />} />
        <Route path="households/:id" element={<HouseholdDetail />} />
        <Route path="households/search" element={<HouseholdSearch />} />
        
        <Route
          path="users"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="logs"
          element={
            <ProtectedRoute requiredRole="admin">
              <OperationLogs />
            </ProtectedRoute>
          }
        />
        
        <Route path="password" element={<PasswordChange />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
