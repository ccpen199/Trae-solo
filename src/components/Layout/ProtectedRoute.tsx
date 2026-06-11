import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore, selectIsLoggedIn, selectUserRole } from '../../store/user';
import type { UserRole } from '../../../shared/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const isLoggedIn = useUserStore(selectIsLoggedIn);
  const userRole = useUserStore(selectUserRole);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && userRole && !roles.includes(userRole)) {
    return <Navigate to="/403" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
