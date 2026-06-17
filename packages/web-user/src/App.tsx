import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import OrdersPage from '@/pages/OrdersPage';
import ProfilePage from '@/pages/ProfilePage';
import VisaApplyPage from '@/pages/VisaApplyPage';
import ViolationPage from '@/pages/ViolationPage';
import InspectionApplyPage from '@/pages/InspectionApplyPage';
import IdCardApplyPage from '@/pages/IdCardApplyPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import IdentityVerifyPage from '@/pages/IdentityVerifyPage';
import LoginPage from '@/pages/LoginPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="order/:id" element={<OrderDetailPage />} />
          <Route path="apply/visa" element={<VisaApplyPage />} />
          <Route path="apply/idcard" element={<IdCardApplyPage />} />
          <Route path="vehicle/violation" element={<ViolationPage />} />
          <Route path="vehicle/inspection" element={<InspectionApplyPage />} />
          <Route path="identity-verify" element={<IdentityVerifyPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
