import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, setAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      const demoUser: User = {
        id: 1,
        name: '演示管理员',
        idCard: '340000199001010001',
        phone: '13800000000',
        email: 'demo-admin@example.com',
        userType: 'natural',
        roles: ['admin', 'operator']
      };
      setAuth('local-demo-admin-token', demoUser);
    }
  }, [isAuthenticated, setAuth]);

  if (!isAuthenticated) {
    return <div style={{ padding: 24, textAlign: 'center' }}>正在进入演示工作台...</div>;
  }

  if (roles && user) {
    const hasRole = roles.some((r) => user.roles?.includes(r));
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
