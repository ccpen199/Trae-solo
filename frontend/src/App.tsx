import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import Login from '@/pages/Login';
import ResidentLayout from '@/residents/Layout';
import PropertyLayout from '@/property/Layout';
import OperatorLayout from '@/operator/Layout';
import ResidentHome from '@/residents/Home';
import ResidentDevices from '@/residents/Devices';
import ResidentDeviceDetail from '@/residents/DeviceDetail';
import ResidentBookings from '@/residents/Bookings';
import ResidentOrders from '@/residents/Orders';
import ResidentWallet from '@/residents/Wallet';
import ResidentEco from '@/residents/Eco';
import ResidentScan from '@/residents/Scan';
import PropertyDashboard from '@/property/Dashboard';
import PropertyDevices from '@/property/Devices';
import PropertyWorkOrders from '@/property/WorkOrders';
import OperatorDashboard from '@/operator/Dashboard';
import OperatorDevices from '@/operator/Devices';
import OperatorAnalytics from '@/operator/Analytics';
import OperatorPackages from '@/operator/Packages';
import OperatorWorkOrders from '@/operator/WorkOrders';
import OperatorEco from '@/operator/Eco';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { loadUser, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadUser();
    }
  }, [isAuthenticated]);

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'resident': return '/resident';
      case 'property': return '/property';
      case 'operator':
      case 'admin': return '/operator';
      default: return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      
      <Route path="/resident/*" element={
        <ProtectedRoute roles={['resident']}>
          <ResidentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ResidentHome />} />
        <Route path="devices" element={<ResidentDevices />} />
        <Route path="devices/:id" element={<ResidentDeviceDetail />} />
        <Route path="bookings" element={<ResidentBookings />} />
        <Route path="orders" element={<ResidentOrders />} />
        <Route path="wallet" element={<ResidentWallet />} />
        <Route path="eco" element={<ResidentEco />} />
        <Route path="scan" element={<ResidentScan />} />
      </Route>
      
      <Route path="/property/*" element={
        <ProtectedRoute roles={['property']}>
          <PropertyLayout />
        </ProtectedRoute>
      }>
        <Route index element={<PropertyDashboard />} />
        <Route path="devices" element={<PropertyDevices />} />
        <Route path="work-orders" element={<PropertyWorkOrders />} />
      </Route>
      
      <Route path="/operator/*" element={
        <ProtectedRoute roles={['operator', 'admin']}>
          <OperatorLayout />
        </ProtectedRoute>
      }>
        <Route index element={<OperatorDashboard />} />
        <Route path="devices" element={<OperatorDevices />} />
        <Route path="analytics" element={<OperatorAnalytics />} />
        <Route path="packages" element={<OperatorPackages />} />
        <Route path="work-orders" element={<OperatorWorkOrders />} />
        <Route path="eco" element={<OperatorEco />} />
      </Route>
      
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
};

export default App;
