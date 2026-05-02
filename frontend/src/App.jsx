import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { authApi } from './services/api';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Policies from './pages/Policies';
import Claims from './pages/Claims';
import Notifications from './pages/Notifications';

const PrivateRoute = ({ children }) => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        navigate('/login', { state: { from: location } });
        return;
      }
      
      try {
        await authApi.getMe();
      } catch (error) {
        useAuthStore.getState().clearAuth();
        navigate('/login', { state: { from: location } });
      }
    };
    
    checkAuth();
  }, [token, navigate, location]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/products" element={
        <PrivateRoute>
          <Products />
        </PrivateRoute>
      } />
      <Route path="/policies" element={
        <PrivateRoute>
          <Policies />
        </PrivateRoute>
      } />
      <Route path="/claims" element={
        <PrivateRoute>
          <Claims />
        </PrivateRoute>
      } />
      <Route path="/notifications" element={
        <PrivateRoute>
          <Notifications />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
