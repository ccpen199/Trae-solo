import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Home from './pages/Home';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import PublishProduct from './pages/PublishProduct';
import MyProducts from './pages/MyProducts';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import Announcements from './pages/Announcements';
import AnnouncementDetail from './pages/AnnouncementDetail';
import AppLayout from './components/Layout';

const PrivateRoute = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  }
  
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AdminRoute = ({ element }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  }
  
  return (isAuthenticated && user?.role === 'admin') ? (
    <AppLayout>{element}</AppLayout>
  ) : (
    <Navigate to="/" replace />
  );
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/announcements',
    element: <Announcements />
  },
  {
    path: '/announcements/:id',
    element: <AnnouncementDetail />
  },
  {
    path: '/products/:id',
    element: <ProductDetail />
  },
  {
    path: '/publish',
    element: <PrivateRoute element={<PublishProduct />} />
  },
  {
    path: '/publish/:id',
    element: <PrivateRoute element={<PublishProduct />} />
  },
  {
    path: '/my-products',
    element: <PrivateRoute element={<MyProducts />} />
  },
  {
    path: '/profile',
    element: <PrivateRoute element={<Profile />} />
  },
  {
    path: '/orders',
    element: <PrivateRoute element={<Orders />} />
  },
  {
    path: '/favorites',
    element: <PrivateRoute element={<Favorites />} />
  },
  {
    path: '/admin',
    element: <AdminRoute element={<AdminDashboard />} />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default router;
