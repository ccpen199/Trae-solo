import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, LoginRequest } from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  switchRole: (role: UserRole) => void;
  initialize: () => Promise<void>;
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

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(data);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '登录失败',
            isLoading: false,
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
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({ user, isLoading: false });
        } catch (err) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      switchRole: (role) => {
        set({ user: mockUsers[role] });
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
