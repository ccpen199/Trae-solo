import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import NurseDashboard from '@/pages/nurse/Dashboard';
import NurseVerification from '@/pages/nurse/Verification';
import NurseOrders from '@/pages/nurse/Orders';
import NurseOrderDetail from '@/pages/nurse/OrderDetail';
import FamilyDashboard from '@/pages/family/Dashboard';
import BookService from '@/pages/family/BookService';
import FamilyOrders from '@/pages/family/Orders';
import FamilyOrderDetail from '@/pages/family/OrderDetail';
import PatientRecord from '@/pages/family/PatientRecord';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminServices from '@/pages/admin/Services';
import AdminDispatch from '@/pages/admin/Dispatch';
import AdminNurses from '@/pages/admin/Nurses';
import AdminInsurance from '@/pages/admin/Insurance';
import AuditLogs from '@/pages/admin/AuditLogs';
import AdverseEvents from '@/pages/admin/AdverseEvents';
import Education from '@/pages/admin/Education';
import QualityDashboard from '@/pages/admin/QualityDashboard';

function ProtectedLayout({ allowedRoles }: { allowedRoles: string[] }) {
  const { isAuthenticated, user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F6CBD]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    const dashboardMap: Record<string, string> = {
      nurse: '/nurse/dashboard',
      family: '/family/dashboard',
      admin: '/admin/dashboard',
      regulator: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  return <Layout><Outlet /></Layout>;
}

function AuthInit({ children }: { children: React.ReactNode }) {
  const { fetchMe, loading } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F6CBD]" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthInit>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedLayout allowedRoles={['nurse']} />}>
            <Route path="/nurse" element={<Navigate to="/nurse/dashboard" replace />} />
            <Route path="/nurse/dashboard" element={<NurseDashboard />} />
            <Route path="/nurse/verification" element={<NurseVerification />} />
            <Route path="/nurse/orders" element={<NurseOrders />} />
            <Route path="/nurse/order/:id" element={<NurseOrderDetail />} />
          </Route>

          <Route element={<ProtectedLayout allowedRoles={['family']} />}>
            <Route path="/family" element={<Navigate to="/family/dashboard" replace />} />
            <Route path="/family/dashboard" element={<FamilyDashboard />} />
            <Route path="/family/book-service" element={<BookService />} />
            <Route path="/family/orders" element={<FamilyOrders />} />
            <Route path="/family/order/:id" element={<FamilyOrderDetail />} />
            <Route path="/family/patient/:id" element={<PatientRecord />} />
          </Route>

          <Route element={<ProtectedLayout allowedRoles={['admin', 'regulator']} />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/dispatch" element={<AdminDispatch />} />
            <Route path="/admin/nurses" element={<AdminNurses />} />
            <Route path="/admin/insurance" element={<AdminInsurance />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
            <Route path="/admin/adverse-events" element={<AdverseEvents />} />
            <Route path="/admin/education" element={<Education />} />
            <Route path="/admin/quality" element={<QualityDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthInit>
    </Router>
  );
}
