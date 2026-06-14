import { useCallback, useMemo } from 'react';
import { usePermissionStore } from '@/stores/usePermissionStore';
import { useUserStore } from '@/stores/useUserStore';

export interface UsePermissionReturn {
  hasRoute: (path: string) => boolean;
  hasButton: (key: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  filterRoutes: <T extends { path: string; hidden?: boolean }>(routes: T[]) => T[];
  filterButtons: <T extends { key: string; hide?: boolean }>(buttons: T[]) => T[];
  isAdmin: () => boolean;
}

const usePermission = (): UsePermissionReturn => {
  const { routes, buttons, hasRoute: checkRoute, hasButton: checkButton } = usePermissionStore();
  const { userInfo } = useUserStore();

  const hasRoute = useCallback(
    (path: string) => {
      if (routes.length === 0) return true;
      return checkRoute(path);
    },
    [routes, checkRoute]
  );

  const hasButton = useCallback(
    (key: string) => {
      if (buttons.length === 0) return true;
      return checkButton(key);
    },
    [buttons, checkButton]
  );

  const hasRole = useCallback(
    (role: string | string[]) => {
      if (!userInfo?.role) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(userInfo.role);
    },
    [userInfo?.role]
  );

  const hasPermission = useCallback(
    (permission: string) => {
      if (!userInfo?.permissions || userInfo.permissions.length === 0) return true;
      if (userInfo.permissions.includes('*')) return true;
      return userInfo.permissions.includes(permission);
    },
    [userInfo?.permissions]
  );

  const isAdmin = useCallback(() => {
    return userInfo?.role === 'super_admin' || userInfo?.role === 'admin';
  }, [userInfo?.role]);

  const filterRoutes = useCallback(
    <T extends { path: string; hidden?: boolean }>(routeList: T[]): T[] => {
      return routeList.filter((route) => {
        if (route.hidden) return false;
        return hasRoute(route.path);
      });
    },
    [hasRoute]
  );

  const filterButtons = useCallback(
    <T extends { key: string; hide?: boolean }>(buttonList: T[]): T[] => {
      return buttonList.filter((btn) => {
        if (btn.hide) return false;
        return hasButton(btn.key);
      });
    },
    [hasButton]
  );

  return useMemo(
    () => ({
      hasRoute,
      hasButton,
      hasRole,
      hasPermission,
      filterRoutes,
      filterButtons,
      isAdmin,
    }),
    [hasRoute, hasButton, hasRole, hasPermission, filterRoutes, filterButtons, isAdmin]
  );
};

export default usePermission;
