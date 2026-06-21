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
}

export default function Layout({ children, requiredRole, pageTitle, pageSubtitle }: LayoutProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
