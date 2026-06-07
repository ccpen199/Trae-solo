import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import PackageTracking from './pages/PackageTracking';
import Subscriptions from './pages/Subscriptions';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import Profile from './pages/Profile';
import DigitalStamp from './pages/DigitalStamp';
import AdminDashboard from './pages/admin/Dashboard';
import ContentReview from './pages/admin/ContentReview';
import SubscriptionHealth from './pages/admin/SubscriptionHealth';
import AddressChangeReview from './pages/admin/AddressChangeReview';
import OutletManagement from './pages/admin/OutletManagement';
import TicketManagement from './pages/admin/TicketManagement';
import AdManagement from './pages/admin/AdManagement';
import DigitalCollection from './pages/admin/DigitalCollection';

const DEMO_ADMIN_USER = {
  id: 1,
  username: 'admin',
  real_name: '演示管理员',
  type: 'enterprise',
  permissions: ['admin', 'content', 'subscription', 'ticket']
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      localStorage.setItem('token', 'local-demo-admin');
      localStorage.setItem('user', JSON.stringify(DEMO_ADMIN_USER));
      setUser(DEMO_ADMIN_USER);
    }
  }, []);

  const canAccessAdmin = user?.type === 'enterprise' || user?.username === 'admin';

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Register setUser={setUser} />} />
      
      <Route path="/" element={<Layout user={user} setUser={setUser} />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="tracking" element={<PackageTracking />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="stamp" element={<DigitalStamp />} />
        <Route path="profile" element={<Profile user={user} setUser={setUser} />} />
        
        <Route path="admin/dashboard" element={canAccessAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="admin/content" element={canAccessAdmin ? <ContentReview /> : <Navigate to="/login" />} />
        <Route path="admin/subscription-health" element={canAccessAdmin ? <SubscriptionHealth /> : <Navigate to="/login" />} />
        <Route path="admin/address-changes" element={canAccessAdmin ? <AddressChangeReview /> : <Navigate to="/login" />} />
        <Route path="admin/outlets" element={canAccessAdmin ? <OutletManagement /> : <Navigate to="/login" />} />
        <Route path="admin/tickets" element={canAccessAdmin ? <TicketManagement /> : <Navigate to="/login" />} />
        <Route path="admin/ads" element={canAccessAdmin ? <AdManagement /> : <Navigate to="/login" />} />
        <Route path="admin/digital" element={canAccessAdmin ? <DigitalCollection /> : <Navigate to="/login" />} />
        <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
