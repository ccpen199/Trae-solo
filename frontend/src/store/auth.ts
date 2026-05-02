import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role, Permission, ROLE_PERMISSIONS } from '@hospital/shared';

interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  permissions: Permission[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (role: Role | Role[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        set({
          user: { ...user, permissions },
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },

      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const user = get().user;
        if (!user) return false;
        return permissions.some((p) => user.permissions.includes(p));
      },

      updateUser: (updates) => {
        const user = get().user;
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
