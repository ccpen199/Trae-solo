import React, { createContext, useContext, useMemo, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import {
  PermissionKey,
  AdminRole,
  hasPermission,
  hasAnyPermission,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  PERMISSIONS,
} from '../../services/permissions';
import { useAdminStore, AdminUser } from '../../store/adminStore';
import * as api from '../../services/api';

export interface ServiceContextValue {
  admin: AdminUser | null;
  role: AdminRole | string;
  permissions: PermissionKey[];
  roleLabel: string;
  can: (permission: PermissionKey) => boolean;
  canAny: (permissions: PermissionKey[]) => boolean;
  requirePermission: (permission: PermissionKey, children: ReactNode, fallback?: ReactNode) => ReactNode | null;
  api: typeof api;
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
    warning: (msg: string) => void;
  };
  navigate: ReturnType<typeof useNavigate>;
  logout: () => void;
}

const ServiceContext = createContext<ServiceContextValue | null>(null);

export const useService = (): ServiceContextValue => {
  const ctx = useContext(ServiceContext);
  if (!ctx) {
    throw new Error(
      'useService 必须在 <ServiceProvider> 内使用。请将组件包裹在 ServiceProvider 中。'
    );
  }
  return ctx;
};

interface ServiceProviderProps {
  children: ReactNode;
}

const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { admin, logout: storeLogout } = useAdminStore();
  const role: AdminRole | string = admin?.role || 'viewer';

  const permissions = useMemo<PermissionKey[]>(() => {
    return ROLE_PERMISSIONS[role as AdminRole] || [];
  }, [role]);

  const roleLabel = ROLE_LABELS[role as AdminRole] || String(role);

  const can = useCallback(
    (permission: PermissionKey) => hasPermission(role, permission),
    [role]
  );

  const canAny = useCallback(
    (perms: PermissionKey[]) => hasAnyPermission(role, perms),
    [role]
  );

  const requirePermission = useCallback(
    (permission: PermissionKey, child: ReactNode, fallback?: ReactNode): ReactNode | null => {
      if (can(permission)) return <>{child}</>;
      return fallback !== undefined ? <>{fallback}</> : null;
    },
    [can]
  );

  const toast = useMemo(
    () => ({
      success: (msg: string) => message.success(msg),
      error: (msg: string) => message.error(msg),
      info: (msg: string) => message.info(msg),
      warning: (msg: string) => message.warning(msg),
    }),
    []
  );

  const logout = useCallback(() => {
    storeLogout();
    navigate('/login');
    toast.success('已退出登录');
  }, [storeLogout, navigate, toast]);

  const value = useMemo<ServiceContextValue>(
    () => ({
      admin,
      role,
      permissions,
      roleLabel,
      can,
      canAny,
      requirePermission,
      api,
      toast,
      navigate,
      logout,
    }),
    [admin, role, permissions, roleLabel, can, canAny, requirePermission, toast, navigate, logout]
  );

  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
};

export { PERMISSIONS };
export default ServiceProvider;
