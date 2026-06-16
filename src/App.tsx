import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import MainLayout from '@/layouts/MainLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import PetList from '@/pages/PetList';
import PetDetail from '@/pages/PetDetail';
import ConsultationList from '@/pages/ConsultationList';
import ConsultationDetail from '@/pages/ConsultationDetail';
import HospitalList from '@/pages/HospitalList';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Community from '@/pages/Community';
import LostPet from '@/pages/LostPet';
import Calendar from '@/pages/Calendar';
import DoctorDashboard from '@/pages/DoctorDashboard';
import type { UserRole } from '@shared/types';

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: UserRole[];
}) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user && !requiredRole.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'doctor' ? '/doctor/dashboard' : '/'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />

          <Route path="/pets" element={<PetList />} />
          <Route path="/pets/:id" element={<PetDetail />} />

          <Route path="/consultations" element={<ConsultationList />} />
          <Route path="/consultations/:id" element={<ConsultationDetail />} />

          <Route path="/hospitals" element={<HospitalList />} />
          <Route path="/hospitals/:id" element={<HospitalList />} />

          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:id" element={<ProductDetail />} />

          <Route path="/community" element={<Community />} />

          <Route path="/lost-pet" element={<LostPet />} />
          <Route path="/lost-pet/:id" element={<LostPet />} />

          <Route path="/calendar" element={<Calendar />} />
        </Route>

        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRole={['doctor']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
