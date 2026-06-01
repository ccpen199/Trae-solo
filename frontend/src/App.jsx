import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import MeetingDetail from './pages/MeetingDetail';
import ActionItems from './pages/ActionItems';
import ActionItemDetail from './pages/ActionItemDetail';
import Workbench from './pages/Workbench';
import AuditLogs from './pages/AuditLogs';

function PrivateRoute({ children, requiredRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#f5222d' }}>权限不足，无法访问此页面</div>;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', fontSize: 18 }}>加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      
      <Route path="/meetings" element={
        <PrivateRoute>
          <Meetings />
        </PrivateRoute>
      } />
      
      <Route path="/meetings/:id" element={
        <PrivateRoute>
          <MeetingDetail />
        </PrivateRoute>
      } />
      
      <Route path="/action-items" element={
        <PrivateRoute>
          <ActionItems />
        </PrivateRoute>
      } />
      
      <Route path="/action-items/:id" element={
        <PrivateRoute>
          <ActionItemDetail />
        </PrivateRoute>
      } />
      
      <Route path="/workbench" element={
        <PrivateRoute>
          <Workbench />
        </PrivateRoute>
      } />
      
      <Route path="/audit-logs" element={
        <PrivateRoute requiredRoles={['admin', 'auditor']}>
          <AuditLogs />
        </PrivateRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
