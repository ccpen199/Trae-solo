import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import HomePage from '@/pages/Home';
import LoginPage from '@/pages/Login';
import UnemploymentRegisterPage from '@/pages/employment/UnemploymentRegister';
import EntrepreneurLoanPage from '@/pages/employment/EntrepreneurLoan';
import SkillCertificationPage from '@/pages/employment/SkillCertification';
import InsuranceCertPage from '@/pages/social-insurance/InsuranceCert';
import PaymentQueryPage from '@/pages/social-insurance/PaymentQuery';
import TitleReviewPage from '@/pages/personnel/TitleReview';
import ArbitrationPage from '@/pages/labor-relations/Arbitration';
import SmartQAPage from '@/pages/SmartQA';
import PolicyMatchPage from '@/pages/PolicyMatch';
import OutletsVRPage from '@/pages/OutletsVR';
import AdminDashboardPage from '@/pages/AdminDashboard';
import UserProfilePage from '@/pages/user/Profile';
import UserApplicationsPage from '@/pages/user/Applications';
import UserCertificatesPage from '@/pages/user/Certificates';
import { useAuthStore } from '@/store/auth';

function AuthInit() {
  const initAuth = useAuthStore((s) => s.initAuth);
  useEffect(() => {
    initAuth();
  }, [initAuth]);
  return null;
}

export default function App() {
  return (
    <Router>
      <AuthInit />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/employment/unemployment-register" element={<UnemploymentRegisterPage />} />
          <Route path="/employment/entrepreneur-loan" element={<EntrepreneurLoanPage />} />
          <Route path="/employment/skill-certification" element={<SkillCertificationPage />} />
          <Route path="/employment" element={<Navigate to="/employment/unemployment-register" replace />} />
          <Route path="/social-insurance/cert-blockchain" element={<InsuranceCertPage />} />
          <Route path="/social-insurance/payment-query" element={<PaymentQueryPage />} />
          <Route path="/social-insurance" element={<Navigate to="/social-insurance/payment-query" replace />} />
          <Route path="/personnel/title-review" element={<TitleReviewPage />} />
          <Route path="/personnel" element={<Navigate to="/personnel/title-review" replace />} />
          <Route path="/labor-relations/arbitration" element={<ArbitrationPage />} />
          <Route path="/labor-relations" element={<Navigate to="/labor-relations/arbitration" replace />} />
          <Route path="/smart-qa" element={<SmartQAPage />} />
          <Route path="/policy-match" element={<PolicyMatchPage />} />
          <Route path="/service-outlets" element={<OutletsVRPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/user/profile" element={<UserProfilePage />} />
          <Route path="/user/applications" element={<UserApplicationsPage />} />
          <Route path="/user/certificates" element={<UserCertificatesPage />} />
          <Route path="/user" element={<Navigate to="/user/profile" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
