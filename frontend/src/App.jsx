
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ShipperDashboard from './components/ShipperDashboard';
import DriverDashboard from './components/DriverDashboard';
import AdminDashboard from './components/AdminDashboard';

const getUser = () => {
  try {
    const stored = localStorage.getItem('user');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
  return null;
};

const RequireRole = ({ role, children }) => {
  const user = getUser();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

const LogoutWrapper = ({ children, role }) => {
  const user = getUser();
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/';
  };
  return React.cloneElement(children, { user, onLogout: handleLogout });
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/shipper" element={
        <RequireRole role="shipper">
          <LogoutWrapper role="shipper">
            <ShipperDashboard />
          </LogoutWrapper>
        </RequireRole>
      } />
      <Route path="/driver" element={
        <RequireRole role="driver">
          <LogoutWrapper role="driver">
            <DriverDashboard />
          </LogoutWrapper>
        </RequireRole>
      } />
      <Route path="/admin" element={
        <RequireRole role="admin">
          <LogoutWrapper role="admin">
            <AdminDashboard />
          </LogoutWrapper>
        </RequireRole>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
