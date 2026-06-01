import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DevicesPage from './pages/DevicesPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import ScenesPage from './pages/ScenesPage';
import PermissionsPage from './pages/PermissionsPage';
import AdminPage from './pages/AdminPage';
import Layout from './components/Layout';

const checkAuth = (): boolean => {
  try {
    return !!localStorage.getItem('token');
  } catch {
    return false;
  }
};

const checkAdmin = (): boolean => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user?.role === 'admin';
  } catch {
    return false;
  }
};

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const authenticated = checkAuth();
  return authenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const authenticated = checkAuth();
  const isAdminUser = checkAdmin();
  return authenticated && isAdminUser ? <>{children}</> : <Navigate to="/" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
      <Route path="/devices" element={<PrivateRoute><Layout><DevicesPage /></Layout></PrivateRoute>} />
      <Route path="/devices/:id" element={<PrivateRoute><Layout><DeviceDetailPage /></Layout></PrivateRoute>} />
      <Route path="/scenes" element={<PrivateRoute><Layout><ScenesPage /></Layout></PrivateRoute>} />
      <Route path="/permissions" element={<PrivateRoute><Layout><PermissionsPage /></Layout></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><Layout><AdminPage /></Layout></AdminRoute>} />
    </Routes>
  );
}

export default App;
