import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('user' | 'creator' | 'admin' | 'requester')[];
}

export default function RouteGuard({ children, allowedRoles = ['creator', 'admin'] }: RouteGuardProps) {
  const { user, isAuthenticated, isLoading, init } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
