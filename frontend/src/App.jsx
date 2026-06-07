import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.js';
import Login from './pages/Login.jsx';
import RiderDashboard from './pages/rider/Dashboard.jsx';
import RiderOrders from './pages/rider/Orders.jsx';
import RiderOrderDetail from './pages/rider/OrderDetail.jsx';
import RiderWallet from './pages/rider/Wallet.jsx';
import RiderVerification from './pages/rider/Verification.jsx';
import RiderVehicle from './pages/rider/Vehicle.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminRiders from './pages/admin/Riders.jsx';
import AdminHeatmap from './pages/admin/Heatmap.jsx';
import AdminIncentives from './pages/admin/Incentives.jsx';
import AdminAppeals from './pages/admin/Appeals.jsx';
import AdminDispatch from './pages/admin/DispatchRules.jsx';
import AdminFinance from './pages/admin/Finance.jsx';
import Watermark from './components/Watermark.jsx';
import Navbar from './components/Navbar.jsx';

const ProtectedRoute = ({ children, roles }) => {
  const { user, accessToken, logout } = useAuthStore();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    logout();
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Watermark />
      <Navbar />
      {children}
    </>
  );
};

function App() {
  const { user, accessToken } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'admin'
            ? <Navigate to="/admin/dashboard" replace />
            : user?.role === 'rider'
            ? <Navigate to="/rider/dashboard" replace />
            : <Navigate to="/login" replace />}
        </ProtectedRoute>
      } />

      <Route path="/rider/dashboard" element={
        <ProtectedRoute roles={['rider']}>
          <RiderDashboard />
        </ProtectedRoute>
      } />
      <Route path="/rider/orders" element={
        <ProtectedRoute roles={['rider']}>
          <RiderOrders />
        </ProtectedRoute>
      } />
      <Route path="/rider/orders/:id" element={
        <ProtectedRoute roles={['rider']}>
          <RiderOrderDetail />
        </ProtectedRoute>
      } />
      <Route path="/rider/wallet" element={
        <ProtectedRoute roles={['rider']}>
          <RiderWallet />
        </ProtectedRoute>
      } />
      <Route path="/rider/verification" element={
        <ProtectedRoute roles={['rider']}>
          <RiderVerification />
        </ProtectedRoute>
      } />
      <Route path="/rider/vehicle" element={
        <ProtectedRoute roles={['rider']}>
          <RiderVehicle />
        </ProtectedRoute>
      } />

      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute roles={['admin']}>
          <AdminOrders />
        </ProtectedRoute>
      } />
      <Route path="/admin/riders" element={
        <ProtectedRoute roles={['admin']}>
          <AdminRiders />
        </ProtectedRoute>
      } />
      <Route path="/admin/heatmap" element={
        <ProtectedRoute roles={['admin']}>
          <AdminHeatmap />
        </ProtectedRoute>
      } />
      <Route path="/admin/incentives" element={
        <ProtectedRoute roles={['admin']}>
          <AdminIncentives />
        </ProtectedRoute>
      } />
      <Route path="/admin/appeals" element={
        <ProtectedRoute roles={['admin']}>
          <AdminAppeals />
        </ProtectedRoute>
      } />
      <Route path="/admin/dispatch" element={
        <ProtectedRoute roles={['admin']}>
          <AdminDispatch />
        </ProtectedRoute>
      } />
      <Route path="/admin/finance" element={
        <ProtectedRoute roles={['admin']}>
          <AdminFinance />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
