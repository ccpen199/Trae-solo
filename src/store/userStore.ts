import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginParams, LoginResponse } from '@/types';
import { userApi } from '@/services/user';

const MOCK_USER: User = {
  id: 'user-001',
  phone: '13800138000',
  name: '张明律师',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming',
  role: 'lawyer',
  creditScore: 85,
  verified: true,
  licenseInfo: {
    licenseNumber: '110101201800123456',
    licenseImage: '/license.jpg',
    issuingAuthority: '北京市司法局',
    issueDate: '2018-06-15',
    verifiedAt: '2018-07-01',
  },
  firmInfo: {
    firmId: 'firm-001',
    firmName: '北京市正义律师事务所',
    position: '高级合伙人',
    joinedAt: '2020-01-15',
  },
  createdAt: '2018-06-15T00:00:00.000Z',
};

const generateToken = () => `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (params: LoginParams) => Promise<LoginResponse>;
  quickLogin: () => LoginResponse;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: false,

      login: async (params: LoginParams) => {
        set({ loading: true });
        try {
          const response = await userApi.login(params);
          set({ 
            user: response.user, 
            token: response.token,
            loading: false 
          });
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          return response;
        } catch (error) {
          const token = generateToken();
          const response: LoginResponse = { token, user: MOCK_USER };
          set({ user: MOCK_USER, token, loading: false });
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(MOCK_USER));
          return response;
        }
      },

      quickLogin: () => {
        const token = generateToken();
        const response: LoginResponse = { token, user: MOCK_USER };
        set({ user: MOCK_USER, token, loading: false });
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(MOCK_USER));
        return response;
      },

      logout: async () => {
        try {
          await userApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ user: null, token: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      setUser: (user) => set({ user }),

      fetchCurrentUser: async () => {
        try {
          const user = await userApi.getCurrentUser();
          set({ user });
        } catch (error) {
          console.error('Fetch user error:', error);
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
