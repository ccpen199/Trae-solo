import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, roles, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, checkRole } = useAuthStore();
  const location = useLocation();
  const requiredRoles = allowedRoles || roles;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !checkRole(requiredRoles)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
