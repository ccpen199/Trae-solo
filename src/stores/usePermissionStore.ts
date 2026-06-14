import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RoutePermission {
  path: string;
  name: string;
  icon?: string;
  children?: RoutePermission[];
  hidden?: boolean;
}

export interface ButtonPermission {
  key: string;
  name: string;
  description?: string;
}

interface PermissionState {
  routes: RoutePermission[];
  buttons: ButtonPermission[];
  setRoutes: (routes: RoutePermission[]) => void;
  setButtons: (buttons: ButtonPermission[]) => void;
  clearPermissions: () => void;
  hasRoute: (path: string) => boolean;
  hasButton: (key: string) => boolean;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      routes: [],
      buttons: [],
      setRoutes: (routes) => set({ routes }),
      setButtons: (buttons) => set({ buttons }),
      clearPermissions: () => set({ routes: [], buttons: [] }),
      hasRoute: (path) => {
        const checkRoute = (routes: RoutePermission[]): boolean => {
          for (const route of routes) {
            if (route.path === path) return true;
            if (route.children && checkRoute(route.children)) return true;
          }
          return false;
        };
        return checkRoute(get().routes);
      },
      hasButton: (key) => {
        return get().buttons.some((btn) => btn.key === key);
      },
    }),
    {
      name: 'permission-storage',
      partialize: (state) => ({
        routes: state.routes,
        buttons: state.buttons,
      }),
    }
  )
);
