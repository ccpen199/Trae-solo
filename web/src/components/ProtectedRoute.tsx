import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import type { ReactNode } from 'react';
import type { UserRole } from '../types';

interface Props {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      if (user.role === 'resident') return <Navigate to="/home" replace />;
      if (user.role === 'property') return <Navigate to="/property/dashboard" replace />;
      if (user.role === 'operator') return <Navigate to="/operator/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
