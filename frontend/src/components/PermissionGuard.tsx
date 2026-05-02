import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
import { Role, Permission } from '@hospital/shared';

interface PermissionGuardProps {
  children: React.ReactNode;
  roles?: Role[];
  permissions?: Permission[];
  requireAll?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  roles,
  permissions,
  requireAll = false,
}) => {
  const location = useLocation();
  const { isAuthenticated, user, hasRole, hasPermission, hasAnyPermission } =
    useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    const hasRequiredRole = Array.isArray(roles)
      ? roles.some((role) => hasRole(role))
      : hasRole(roles);

    if (!hasRequiredRole) {
      return (
        <Result
          status="403"
          title="权限不足"
          subTitle="您没有权限访问该页面，请联系管理员"
          extra={
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => window.history.back()}
            >
              返回上一页
            </Button>
          }
        />
      );
    }
  }

  if (permissions && permissions.length > 0) {
    let hasRequiredPermission: boolean;

    if (requireAll) {
      hasRequiredPermission = permissions.every((p) => hasPermission(p));
    } else {
      hasRequiredPermission = hasAnyPermission(permissions);
    }

    if (!hasRequiredPermission) {
      return (
        <Result
          status="403"
          title="权限不足"
          subTitle="您没有权限访问该页面，请联系管理员"
          extra={
            <Button
              type="primary"
              icon={<ArrowLeftOutlined />}
              onClick={() => window.history.back()}
            >
              返回上一页
            </Button>
          }
        />
      );
    }
  }

  return <>{children}</>;
};

export default PermissionGuard;
