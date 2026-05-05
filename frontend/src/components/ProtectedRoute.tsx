import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Role } from '@/types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // 根据用户角色跳转
    const defaultPath = user.role === Role.ADMIN 
      ? '/dashboard/users' 
      : '/dashboard/tasks';
    return <Navigate to={defaultPath} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
