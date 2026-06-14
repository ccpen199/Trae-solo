import { create } from 'zustand';
import { get, post, put } from '../utils/request';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  level: number;
  exp: number;
  coins: number;
  inviteCode: string;
  inviterId: string | null;
  isVerified: boolean;
  realName?: string;
  alipayAccount?: string;
  wechatAccount?: string;
  bankName?: string;
  bankCard?: string;
  createdAt: string;
}

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (phone: string) => Promise<{ success: boolean; message?: string }>;
  register: (phone: string, nickname: string, inviteCode?: string) => Promise<{ success: boolean; message?: string }>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { nickname?: string; avatar?: string }) => Promise<void>;
  verifyIdentity: (realName: string, idCard: string) => Promise<{ success: boolean; message?: string }>;
  updateWithdrawAccount: (method: string, account: string, bankName?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: false,

  login: async (phone: string) => {
    try {
      set({ loading: true });
      const result: any = await post('/auth/login', { phone, password: '123456' });
      if (result.success && result.user) {
        localStorage.setItem('userId', result.user.id);
        set({ user: result.user, isLoggedIn: true });
        return { success: true };
      }
      return { success: false, message: result.message || '登录失败' };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      set({ loading: false });
    }
  },

  register: async (phone: string, nickname: string, inviteCode?: string) => {
    try {
      set({ loading: true });
      const result: any = await post('/auth/register', { phone, nickname, inviteCode });
      if (result.success && result.user) {
        localStorage.setItem('userId', result.user.id);
        set({ user: result.user, isLoggedIn: true });
        return { success: true };
      }
      return { success: false, message: result.message || '注册失败' };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      set({ loading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const result: any = await get('/auth/profile');
      if (result.success && result.user) {
        set({ user: result.user, isLoggedIn: true });
      }
    } catch (error) {
      console.error('获取用户信息失败', error);
    }
  },

  updateProfile: async (data) => {
    try {
      const result: any = await put('/auth/profile', data);
      if (result.success && result.user) {
        set({ user: result.user });
      }
    } catch (error) {
      console.error('更新失败', error);
    }
  },

  verifyIdentity: async (realName: string, idCard: string) => {
    try {
      const result: any = await post('/auth/verify', { realName, idCard });
      if (result.success && result.user) {
        set({ user: result.user });
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  updateWithdrawAccount: async (method: string, account: string, bankName?: string) => {
    try {
      const result: any = await post('/auth/withdraw-account', { method, account, bankName });
      if (result.success && result.user) {
        set({ user: result.user });
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem('userId');
    set({ user: null, isLoggedIn: false });
  },
}));
