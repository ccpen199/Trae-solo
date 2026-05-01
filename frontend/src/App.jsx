import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LiveList from './pages/LiveList';
import LiveRoom from './pages/LiveRoom';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    console.log('应用已启动，用户状态:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="lives" element={<LiveList />} />
          <Route path="lives/:id" element={<LiveRoom />} />
          <Route path="orders" element={<Orders />} />
          <Route path="inventory" element={
            <ProtectedRoute requiredRoles={['merchant', 'platform_admin']}>
              <Inventory />
            </ProtectedRoute>
          } />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={
            <ProtectedRoute requiredRoles={['platform_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
