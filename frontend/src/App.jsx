import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useToastStore } from './store/auth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ShopList from './pages/ShopList';
import ShopDetail from './pages/ShopDetail';
import CouponList from './pages/CouponList';
import CouponDetail from './pages/CouponDetail';
import ShareReceive from './pages/ShareReceive';
import ShareDetail from './pages/ShareDetail';
import OrderCreate from './pages/OrderCreate';
import PaySuccess from './pages/PaySuccess';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCoupons from './pages/admin/Coupons';
import AdminShares from './pages/admin/Shares';
import AdminOrders from './pages/admin/Orders';
import AdminShops from './pages/admin/Shops';
import AdminActivities from './pages/admin/Activities';
import AdminUsers from './pages/admin/Users';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem('auth-storage');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <Toast />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="shops" element={<ShopList />} />
          <Route path="shops/:id" element={<ShopDetail />} />
          <Route path="coupons" element={<CouponList />} />
          <Route path="coupons/:id" element={<CouponDetail />} />
          <Route path="share/:shareId" element={<ShareReceive />} />
          <Route path="share-detail/:shareId" element={<ShareDetail />} />
          <Route path="order/create" element={<OrderCreate />} />
          <Route path="pay/success" element={<PaySuccess />} />
        </Route>
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/coupons" element={
          <ProtectedRoute>
            <AdminCoupons />
          </ProtectedRoute>
        } />
        <Route path="/admin/shares" element={
          <ProtectedRoute>
            <AdminShares />
          </ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute>
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="/admin/shops" element={
          <ProtectedRoute>
            <AdminShops />
          </ProtectedRoute>
        } />
        <Route path="/admin/activities" element={
          <ProtectedRoute>
            <AdminActivities />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        } />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
