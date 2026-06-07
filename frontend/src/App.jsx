import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import CreateOrder from './pages/CreateOrder';
import OrderDetail from './pages/OrderDetail';
import MyOrders from './pages/MyOrders';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminQuality from './pages/AdminQuality';
import AdminCapacity from './pages/AdminCapacity';
import AdminAudit from './pages/AdminAudit';
import AdminDrivers from './pages/AdminDrivers';
import AdminComplaints from './pages/AdminComplaints';
import Tracking from './pages/Tracking';

function ProtectedRoute({ children, allowedTypes }) {
  const { user, userType, login, loading } = useAuth();
  const [demoLoginStarted, setDemoLoginStarted] = useState(false);

  useEffect(() => {
    if (!loading && !user && import.meta.env.DEV && allowedTypes?.length && !demoLoginStarted) {
      const demoType = allowedTypes[0];
      login(`local-demo-${demoType}`, {
        id: 1,
        name: demoType === 'admin' ? '演示管理员' : demoType === 'driver' ? '演示司机' : '演示货主',
        username: demoType === 'admin' ? 'demo-admin' : undefined,
        phone: '13800000000'
      }, demoType);
      setDemoLoginStarted(true);
    }
  }, [allowedTypes, demoLoginStarted, loading, login, user]);
  
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  
  if (!user) {
    if (import.meta.env.DEV && allowedTypes?.length) {
      return <div style={{ padding: '40px', textAlign: 'center' }}>正在进入演示业务页...</div>;
    }
    return <Navigate to="/login" replace />;
  }
  
  if (allowedTypes && !allowedTypes.includes(userType)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <div>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/tracking" element={<Tracking />} />
          
          <Route path="/create" element={<Navigate to="/create-order" replace />} />
          <Route path="/my-orders" element={<Navigate to="/orders" replace />} />
          
          <Route path="/create-order" element={
            <ProtectedRoute allowedTypes={['shipper']}>
              <CreateOrder />
            </ProtectedRoute>
          } />
          
          <Route path="/orders" element={
            <ProtectedRoute allowedTypes={['shipper', 'driver']}>
              <MyOrders />
            </ProtectedRoute>
          } />
          
          <Route path="/orders/:id" element={
            <ProtectedRoute allowedTypes={['shipper', 'driver']}>
              <OrderDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/driver" element={
            <ProtectedRoute allowedTypes={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/quality" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AdminQuality />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/capacity" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AdminCapacity />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AdminAudit />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/drivers" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AdminDrivers />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/complaints" element={
            <ProtectedRoute allowedTypes={['admin']}>
              <AdminComplaints />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
