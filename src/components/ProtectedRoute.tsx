import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
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

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const dashboardMap: Record<string, string> = {
      nurse: '/nurse/dashboard',
      family: '/family/dashboard',
      admin: '/admin/dashboard',
      regulator: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
}
