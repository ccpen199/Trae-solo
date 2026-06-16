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
import HospitalDashboard from '@/pages/HospitalDashboard';
import MerchantDashboard from '@/pages/MerchantDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import PlatformDashboard from '@/pages/PlatformDashboard';
import OpsDashboard from '@/pages/OpsDashboard';
import type { UserRole } from '@shared/types';

const ROLE_HOME_MAP: Record<UserRole, string> = {
  owner: '/',
  doctor: '/doctor/dashboard',
  hospital: '/hospital/dashboard',
  merchant: '/merchant/dashboard',
  admin: '/admin/dashboard',
  platform: '/platform/dashboard',
  ops: '/ops/dashboard',
};

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
    return <Navigate to={ROLE_HOME_MAP[user.role] || '/'} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    return <Navigate to={ROLE_HOME_MAP[user.role] || '/'} replace />;
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

        {/* 宠主前台：owner 及以上角色可访问 */}
        <Route
          element={
            <ProtectedRoute requiredRole={['owner', 'admin', 'platform', 'ops']}>
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

        {/* 医生工作台 */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRole={['doctor', 'admin', 'platform', 'ops']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
        </Route>

        {/* 医院后台 */}
        <Route
          path="/hospital/dashboard"
          element={
            <ProtectedRoute requiredRole={['hospital', 'admin', 'platform', 'ops']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HospitalDashboard />} />
        </Route>

        {/* 商家后台 */}
        <Route
          path="/merchant/dashboard"
          element={
            <ProtectedRoute requiredRole={['merchant', 'admin', 'platform', 'ops']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MerchantDashboard />} />
        </Route>

        {/* Admin 超级管理员 */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole={['admin', 'platform', 'ops']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
        </Route>

        {/* 平台运营 */}
        <Route
          path="/platform/dashboard"
          element={
            <ProtectedRoute requiredRole={['platform', 'admin', 'ops']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PlatformDashboard />} />
        </Route>

        {/* 运维工程师 */}
        <Route
          path="/ops/dashboard"
          element={
            <ProtectedRoute requiredRole={['ops', 'admin', 'platform']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OpsDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
