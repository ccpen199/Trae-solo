import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'user' | 'creator' | 'admin';
}

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading, fetchProfile } = useAuthStore();
  const location = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && !user) {
        await fetchProfile();
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [isAuthenticated, user, fetchProfile]);

  if (checkingAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-zinc-500">正在验证权限...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  if (requireRole && user?.role !== requireRole) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user?.role === 'creator') {
      return <Navigate to="/workspace" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
