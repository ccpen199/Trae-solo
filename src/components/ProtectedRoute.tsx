import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { isAuthenticated, user, fetchProfile, logout } = useAuthStore();
  const location = useLocation();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user || checking) return;

    let cancelled = false;
    setChecking(true);
    fetchProfile()
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [checking, fetchProfile, isAuthenticated, logout, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-warm-500">
        正在恢复登录状态...
      </div>
    );
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
