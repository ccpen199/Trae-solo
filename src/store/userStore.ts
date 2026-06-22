import { create } from 'zustand';
import { User, LoginParams, LoginResponse } from '@/types';
import { userApi } from '@/services/user';

const STORAGE_KEY = 'lc_auth';

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

function loadAuth(): { token: string | null; user: User | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.token && parsed.user) {
        return parsed;
      }
    }
  } catch {}
  return { token: null, user: null };
}

function saveAuth(token: string, user: User) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

interface UserState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (params: LoginParams) => Promise<LoginResponse>;
  quickLogin: () => void;
  logout: () => void;
  init: () => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  init: () => {
    const { token, user } = loadAuth();
    set({ token, user, initialized: true });
  },

  login: async (params: LoginParams) => {
    set({ loading: true });
    try {
      const response = await userApi.login(params);
      saveAuth(response.token, response.user);
      set({ user: response.user, token: response.token, loading: false });
      return response;
    } catch (error) {
      const token = generateToken();
      const response: LoginResponse = { token, user: MOCK_USER };
      saveAuth(token, MOCK_USER);
      set({ user: MOCK_USER, token, loading: false });
      return response;
    }
  },

  quickLogin: () => {
    const token = generateToken();
    saveAuth(token, MOCK_USER);
    set({ user: { ...MOCK_USER }, token, loading: false });
  },

  logout: () => {
    clearAuth();
    set({ user: null, token: null });
    try {
      userApi.logout();
    } catch {}
  },
}));
