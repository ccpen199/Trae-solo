import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import QRCode from './pages/QRCode';
import RoutePlanning from './pages/RoutePlanning';
import MyCards from './pages/MyCards';
import LifeService from './pages/LifeService';
import PointsMall from './pages/PointsMall';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCards from './pages/admin/Cards';
import AdminTransactions from './pages/admin/Transactions';
import AdminRisk from './pages/admin/Risk';
import AdminRenewals from './pages/admin/Renewals';
import AdminRoutes from './pages/admin/Routes';
import AdminProducts from './pages/admin/Products';
import AdminLogs from './pages/admin/Logs';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="qrcode" element={<QRCode />} />
        <Route path="route-planning" element={<RoutePlanning />} />
        <Route path="my-cards" element={<MyCards />} />
        <Route path="life-service" element={<LifeService />} />
        <Route path="points-mall" element={<PointsMall />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="cards" element={<AdminCards />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="risk" element={<AdminRisk />} />
        <Route path="renewals" element={<AdminRenewals />} />
        <Route path="routes" element={<AdminRoutes />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
