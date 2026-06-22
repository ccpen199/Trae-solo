import { Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface LayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  pageTitle: string;
  pageSubtitle?: string;
  requireCertification?: boolean;
}

export default function Layout({ children, requiredRole, pageTitle, pageSubtitle, requireCertification = false }: LayoutProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const role = useAuthStore((s) => s.role);
  const isCertified = useAuthStore((s) => s.isCertified);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== requiredRole) {
    if (requiredRole === 'enterprise' && role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (requiredRole === 'applicant' && role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (requiredRole === 'admin' && role === 'enterprise') return <Navigate to="/enterprise/jobs" replace />;
    if (requiredRole === 'applicant' && role === 'enterprise') return <Navigate to="/enterprise/jobs" replace />;
    if (requiredRole === 'admin' && role === 'applicant') return <Navigate to="/applicant/home" replace />;
    if (requiredRole === 'enterprise' && role === 'applicant') return <Navigate to="/applicant/home" replace />;
    return <Navigate to="/login" replace />;
  }

  if (requireCertification && role === 'enterprise' && !isCertified) {
    return <Navigate to="/enterprise/certification" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-ash-50/50">
      {role && <Sidebar role={role} />}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header title={pageTitle} subtitle={pageSubtitle} />
        <main className="flex-1 p-8 overflow-auto animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
