import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import MainLayout from '@/components/layout/MainLayout';
import AuthPage from '@/pages/auth/AuthPage';
import HomePage from '@/pages/home/HomePage';
import AccountPage from '@/pages/account/AccountPage';
import MedicalRecordsPage from '@/pages/medical/MedicalRecordsPage';
import MedicalRecordDetailPage from '@/pages/medical/MedicalRecordDetailPage';
import ChronicDiseasePage from '@/pages/chronic/ChronicDiseasePage';
import RegistrationPage from '@/pages/registration/RegistrationPage';
import HospitalRegistrationPage from '@/pages/registration/HospitalRegistrationPage';
import PaymentPage from '@/pages/payment/PaymentPage';
import PaymentDetailPage from '@/pages/payment/PaymentDetailPage';
import NavigationPage from '@/pages/navigation/NavigationPage';
import NotificationPage from '@/pages/notification/NotificationPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/home" replace />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/medical" element={<MedicalRecordsPage />} />
        <Route path="/medical/:id" element={<MedicalRecordDetailPage />} />
        <Route path="/chronic" element={<ChronicDiseasePage />} />
        <Route path="/registration" element={<RegistrationPage />} />
        <Route path="/registration/hospital/:id" element={<HospitalRegistrationPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/:id" element={<PaymentDetailPage />} />
        <Route path="/navigation" element={<NavigationPage />} />
        <Route path="/notification" element={<NotificationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
