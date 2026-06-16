import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const user = useAuthStore(s => s.user);
  const token = useAuthStore(s => s.token);
  const checkAuth = useAuthStore(s => s.checkAuth);
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    
    if (isAuthenticated && token && user) {
      setChecking(false);
      hasChecked.current = true;
      return;
    }

    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      checkAuth().finally(() => {
        setChecking(false);
        hasChecked.current = true;
      });
    } else {
      setChecking(false);
      hasChecked.current = true;
    }
  }, [isAuthenticated, token, user, checkAuth]);

  useEffect(() => {
    if (isAuthenticated && checking) {
      setChecking(false);
    }
  }, [isAuthenticated, checking]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'clerk') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
