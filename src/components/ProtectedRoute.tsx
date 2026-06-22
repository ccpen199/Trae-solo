import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useUserStore } from '@/store/userStore';
import type { UserRole } from 'shared/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRoles?: UserRole[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  PERSONAL: '个人用户',
  ENTERPRISE_HR: '企业HR',
  FINANCE: '财务人员',
  CS_AGENT: '客服专员',
  ADMIN: '平台管理员',
};

const ROLE_HOME_MAP: Record<UserRole, string> = {
  PERSONAL: '/dashboard',
  ENTERPRISE_HR: '/dashboard',
  FINANCE: '/finance',
  CS_AGENT: '/support',
  ADMIN: '/admin/dashboard',
};

function ProtectedRoute({
  children,
  requireAuth = true,
  requireRoles,
}: ProtectedRouteProps) {
  const { isLoggedIn, user } = useUserStore();
  const location = useLocation();

  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoggedIn && requireRoles && user && !requireRoles.includes(user.role)) {
    const allowedNames = requireRoles.map((r) => ROLE_LABELS[r]).join('/');
    const actualName = ROLE_LABELS[user.role] || '未知角色';
    message.warning(`当前账号为${actualName}，无权限访问该页面（需要${allowedNames}权限）`);
    const target = ROLE_HOME_MAP[user.role] || '/dashboard';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
