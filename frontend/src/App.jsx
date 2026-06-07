import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/user';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Certificates from './pages/Certificates';
import Services from './pages/Services';
import Applications from './pages/Applications';
import Policy from './pages/Policy';
import CityServices from './pages/CityServices';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminServiceConfig from './pages/admin/ServiceConfig';
import AdminGateway from './pages/admin/Gateway';
import AdminAudit from './pages/admin/Audit';
import ServiceGuide from './pages/ServiceGuide';
import ServiceDetail from './pages/ServiceDetail';
import ApplicationDetail from './pages/ApplicationDetail';
import ApplyService from './pages/ApplyService';

function AdminGuard({ children }) {
  const { user } = useUserStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.type !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function App() {
  const { isElderMode } = useUserStore();

  return (
    <div className={isElderMode ? 'elder-mode' : ''}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:id" element={<ServiceDetail />} />
          <Route path="apply/:id" element={<ApplyService />} />
          <Route path="guide" element={<ServiceGuide />} />
          <Route path="applications" element={<Applications />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="policy" element={<Policy />} />
          <Route path="city" element={<CityServices />} />
          <Route path="profile" element={<Profile />} />

          <Route path="admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="admin/services" element={<AdminGuard><AdminServiceConfig /></AdminGuard>} />
          <Route path="admin/gateway" element={<AdminGuard><AdminGateway /></AdminGuard>} />
          <Route path="admin/audit" element={<AdminGuard><AdminAudit /></AdminGuard>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
