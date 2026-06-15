import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'guest' | 'jobseeker' | 'enterprise' | 'admin';

export interface UserInfo {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  company?: string;
}

interface AuthState {
  role: UserRole;
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (role: UserRole, user: UserInfo) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setUser: (user: Partial<UserInfo>) => void;
}

const defaultUserMap: Record<UserRole, UserInfo | null> = {
  guest: null,
  jobseeker: {
    id: 'js-001',
    name: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jobseeker',
    email: 'zhangsan@example.com',
    phone: '138****8888',
  },
  enterprise: {
    id: 'ent-001',
    name: '华南智造科技有限公司',
    avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=enterprise',
    email: 'hr@scimake.com',
    phone: '020-8888****',
    company: '华南智造科技有限公司',
  },
  admin: {
    id: 'admin-001',
    name: '系统管理员',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin',
    email: 'admin@platform.com',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      role: 'guest',
      user: null,
      isAuthenticated: false,
      login: (role, user) =>
        set({
          role,
          user,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          role: 'guest',
          user: null,
          isAuthenticated: false,
        }),
      switchRole: (role) =>
        set({
          role,
          user: defaultUserMap[role],
          isAuthenticated: role !== 'guest',
        }),
      setUser: (user) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : state.user,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
