import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface Props {
  children: ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const isAuth = useAuthStore(s => s.isAuthenticated);
  const isAdmin = useAuthStore(s => s.isAdmin);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
