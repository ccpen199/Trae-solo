import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, LoginRequest } from '@/types/auth';
import { authService } from '@/services/authService';

interface LoginResult {
  redirectPath: string;
  welcomeMessage: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastLoginResult: LoginResult | null;
  login: (data: LoginRequest) => Promise<LoginResult>;
  loginDirect: (role: UserRole) => LoginResult;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  switchRole: (role: UserRole) => void;
  initialize: () => Promise<void>;
  clearLoginResult: () => void;
}

const mockUsers: Record<UserRole, User> = {
  owner: {
    id: 'owner_001',
    role: 'owner',
    phone: '13800138000',
    nickname: '张小花的铲屎官',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner001',
    createdAt: '2024-01-15T08:00:00Z',
  },
  store_admin: {
    id: 'store_001',
    role: 'store_admin',
    phone: '13900139000',
    nickname: '爱宠屋店长',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=store001',
    storeId: 'store_001',
    createdAt: '2023-06-01T08:00:00Z',
  },
  store_staff: {
    id: 'staff_001',
    role: 'store_staff',
    phone: '13500135000',
    nickname: '美容师小王',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff001',
    storeId: 'store_001',
    createdAt: '2023-09-01T08:00:00Z',
  },
  store_manager: {
    id: 'mgr_001',
    role: 'store_manager',
    phone: '13400134000',
    nickname: '店长老李',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mgr001',
    storeId: 'store_001',
    createdAt: '2023-03-01T08:00:00Z',
  },
  veterinarian: {
    id: 'vet_001',
    role: 'veterinarian',
    phone: '13700137000',
    nickname: '李兽医',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vet001',
    veterinarianId: 'vet_001',
    licenseNo: 'VET20230001',
    createdAt: '2023-01-01T08:00:00Z',
  },
  operator: {
    id: 'op_001',
    role: 'operator',
    phone: '13600136000',
    nickname: '平台管理员',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=op001',
    createdAt: '2023-01-01T08:00:00Z',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastLoginResult: null,

      login: async (data) => {
        set({ isLoading: true, error: null, lastLoginResult: null });
        try {
          const response = await authService.login(data);

          const user = response.user;
          const token = response.token || `token_${data.role}_${Date.now()}`;
          const redirectPath = response.redirectPath || getDefaultRedirectPath(data.role);
          const welcomeMessage = response.welcomeMessage || `登录成功，正在进入${getRoleLabel(data.role)}...`;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastLoginResult: { redirectPath, welcomeMessage },
          });

          localStorage.setItem('auth_token', token);
          return { redirectPath, welcomeMessage };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '登录失败，请检查账号密码';
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
            lastLoginResult: null,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (err) {
          console.error('Logout error:', err);
        }
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
          lastLoginResult: null,
        });
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (err) {
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      clearLoginResult: () => set({ lastLoginResult: null }),

      loginDirect: (role) => {
        const user = mockUsers[role];
        const token = `token_${role}_${Date.now()}`;
        const redirectPath = getDefaultRedirectPath(role);
        const welcomeMessage = `欢迎回来，${user.nickname}！正在进入${getRoleLabel(role)}工作台...`;

        localStorage.setItem('auth_token', token);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          lastLoginResult: { redirectPath, welcomeMessage },
        });

        return { redirectPath, welcomeMessage };
      },

      switchRole: (role) => {
        const user = mockUsers[role];
        const token = `token_${role}_${Date.now()}`;
        localStorage.setItem('auth_token', token);
        set({
          user,
          token,
          isAuthenticated: true,
          lastLoginResult: {
            redirectPath: getDefaultRedirectPath(role),
            welcomeMessage: `已切换到${getRoleLabel(role)}，正在跳转...`,
          },
        });
      },

      initialize: async () => {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            if (data.state?.user && data.state?.token) {
              set({
                user: data.state.user,
                token: data.state.token,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          } catch (e) {
            console.error('Failed to parse auth storage:', e);
          }
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: '宠主端',
    store_admin: '门店管理员',
    store_staff: '门店员工',
    store_manager: '门店店长',
    veterinarian: '执业兽医',
    operator: '平台运营',
  };
  return labels[role] || role;
}

function getDefaultRedirectPath(role: UserRole): string {
  switch (role) {
    case 'owner':
      return '/owner';
    case 'store_admin':
    case 'store_staff':
    case 'store_manager':
    case 'veterinarian':
    case 'operator':
      return '/store';
    default:
      return '/owner';
  }
}

export { getRoleLabel, getDefaultRedirectPath };
