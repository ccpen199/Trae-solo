import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';

import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';

import Home from '@/pages/Home';
import Login from '@/pages/common/Login';
import Messages from '@/pages/common/Messages';

import SocialInsurance from '@/pages/personal/SocialInsurance';
import HousingFund from '@/pages/personal/HousingFund';
import MedicalService from '@/pages/personal/MedicalService';
import ExamCenter from '@/pages/personal/ExamCenter';
import ECard from '@/pages/personal/ECard';
import PersonalProfile from '@/pages/personal/PersonalProfile';

import EnterpriseInsurance from '@/pages/enterprise/EnterpriseInsurance';
import UnemploymentReview from '@/pages/enterprise/UnemploymentReview';
import LaborContract from '@/pages/enterprise/LaborContract';
import EnterpriseProfile from '@/pages/enterprise/EnterpriseProfile';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import Supervision from '@/pages/admin/Supervision';
import AuthCenter from '@/pages/admin/AuthCenter';
import PolicyManagement from '@/pages/admin/PolicyManagement';

const AppRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, userRole } = useUserStore();

  const defaultPath = userRole === 'admin'
    ? '/admin/dashboard'
    : userRole === 'enterprise'
    ? '/enterprise/insurance'
    : '/';

  useEffect(() => {
    const publicPaths = ['/login'];
    if (!isLoggedIn && !publicPaths.includes(location.pathname)) {
      navigate('/login');
    }
    if (isLoggedIn && location.pathname === '/login') {
      navigate(defaultPath);
    }
  }, [defaultPath, isLoggedIn, location.pathname, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/messages" element={<Messages />} />

        <Route path="/personal/social-insurance" element={<SocialInsurance />} />
        <Route path="/personal/housing-fund" element={<HousingFund />} />
        <Route path="/personal/medical" element={<MedicalService />} />
        <Route path="/personal/exam" element={<ExamCenter />} />
        <Route path="/personal/ecard" element={<ECard />} />
        <Route path="/personal/profile" element={<PersonalProfile />} />

        <Route path="/enterprise/insurance" element={<EnterpriseInsurance />} />
        <Route path="/enterprise/unemployment" element={<UnemploymentReview />} />
        <Route path="/enterprise/contract" element={<LaborContract />} />
        <Route path="/enterprise/profile" element={<EnterpriseProfile />} />
      </Route>

      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/supervision" element={<Supervision />} />
        <Route path="/admin/auth-center" element={<AuthCenter />} />
        <Route path="/admin/policy" element={<PolicyManagement />} />
      </Route>

      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRouter;
