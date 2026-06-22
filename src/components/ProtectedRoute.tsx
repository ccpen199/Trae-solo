import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useUserStore } from '@/store/userStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isLoggedIn, user } = useUserStore();
  const location = useLocation();

  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
