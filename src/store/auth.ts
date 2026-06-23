import { create } from 'zustand';
import { auth as authApi } from '@/api';

interface User {
  id: string;
  phone: string;
  name?: string;
  idCard?: string;
  districtId?: string;
  districtName?: string;
  grassrootsId?: string;
  grassrootsName?: string;
  isRealname?: boolean;
  isBindUnion?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  needRealname: boolean;
  needBindUnion: boolean;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  setRealnameDone: () => void;
  setBindUnionDone: (districtName: string, grassrootsName: string) => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  needRealname: false,
  needBindUnion: false,

  login: async (phone: string, code: string) => {
    const res: any = await authApi.login(phone, code);
    const token = res.token || res.data?.token;
    if (token) {
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });
    }
    const user = res.user || res.data?.user;
    if (user) {
      set({
        user,
        needRealname: !user.isRealname,
        needBindUnion: !user.isBindUnion,
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, needRealname: false, needBindUnion: false });
  },

  setRealnameDone: () => {
    set((s) => ({
      needRealname: false,
      user: s.user ? { ...s.user, isRealname: true } : null,
    }));
  },

  setBindUnionDone: (districtName: string, grassrootsName: string) => {
    set((s) => ({
      needBindUnion: false,
      user: s.user ? { ...s.user, isBindUnion: true, districtName, grassrootsName } : null,
    }));
  },

  fetchMe: async () => {
    try {
      const res: any = await authApi.getMe();
      const user = res.user || res.data || res;
      set({
        user,
        needRealname: !user.isRealname,
        needBindUnion: !user.isBindUnion,
      });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));
