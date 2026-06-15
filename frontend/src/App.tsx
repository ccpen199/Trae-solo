import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, message } from 'antd';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import LaborOrders from './pages/LaborOrders';
import LaborOrderDetail from './pages/LaborOrderDetail';
import PublishLabor from './pages/PublishLabor';
import DeliveryOrders from './pages/DeliveryOrders';
import DeliveryOrderDetail from './pages/DeliveryOrderDetail';
import PublishDelivery from './pages/PublishDelivery';
import MovingOrders from './pages/MovingOrders';
import MovingOrderDetail from './pages/MovingOrderDetail';
import PublishMoving from './pages/PublishMoving';
import Profile from './pages/Profile';
import MyOrders from './pages/MyOrders';
import Notifications from './pages/Notifications';
import Disputes from './pages/Disputes';
import InsuranceClaims from './pages/InsuranceClaims';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCapacity from './pages/admin/Capacity';
import AdminPrices from './pages/admin/Prices';
import AdminDisputes from './pages/admin/Disputes';
import AdminQualityRules from './pages/admin/QualityRules';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';

const { Content } = Layout;

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        加载中...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="labor" element={<LaborOrders />} />
        <Route path="labor/:id" element={<LaborOrderDetail />} />
        <Route path="publish/labor" element={<RequireAuth><PublishLabor /></RequireAuth>} />
        <Route path="delivery" element={<DeliveryOrders />} />
        <Route path="delivery/:id" element={<DeliveryOrderDetail />} />
        <Route path="publish/delivery" element={<RequireAuth><PublishDelivery /></RequireAuth>} />
        <Route path="moving" element={<MovingOrders />} />
        <Route path="moving/:id" element={<MovingOrderDetail />} />
        <Route path="publish/moving" element={<RequireAuth><PublishMoving /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="my-orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
        <Route path="notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="disputes" element={<RequireAuth><Disputes /></RequireAuth>} />
        <Route path="insurance" element={<RequireAuth><InsuranceClaims /></RequireAuth>} />
        
        <Route path="admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="admin/capacity" element={<RequireAdmin><AdminCapacity /></RequireAdmin>} />
        <Route path="admin/prices" element={<RequireAdmin><AdminPrices /></RequireAdmin>} />
        <Route path="admin/disputes" element={<RequireAdmin><AdminDisputes /></RequireAdmin>} />
        <Route path="admin/quality-rules" element={<RequireAdmin><AdminQualityRules /></RequireAdmin>} />
        <Route path="admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
        <Route path="admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    message.warning('请先登录');
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" />;
  }
  if (user.role !== 'admin') {
    message.error('权限不足');
    return <Navigate to="/" />;
  }
  return <>{children}</>;
}

export default App;
