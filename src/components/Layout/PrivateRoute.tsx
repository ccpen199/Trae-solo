import React from 'react';
import { Navigate } from 'react-router-dom';
import useUserStore from '@/store/userStore';
import type { UserRole } from '@/types';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRoles }) => {
  const { isLoggedIn, user } = useUserStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.userType as UserRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
