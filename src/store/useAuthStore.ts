import { create } from 'zustand';
import { api } from '@/api/client';
import type { UserIdentity, LoginResponse } from '../../shared/types';

export type LoginErrorCode = 
  | 'SUCCESS'
  | 'ACCOUNT_NOT_FOUND'
  | 'PASSWORD_ERROR'
  | 'VERIFY_CODE_ERROR'
  | 'FACE_VERIFY_FAILED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

interface AuthState {
  user: UserIdentity | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: LoginErrorCode | null;
  loginType: 'password' | 'sms' | 'face';
  login: (phone: string, password: string) => Promise<{ success: boolean; code: LoginErrorCode; user?: UserIdentity }>;
  loginBySms: (phone: string, code: string) => Promise<{ success: boolean; code: LoginErrorCode; user?: UserIdentity }>;
  loginByFace: (faceImage: string) => Promise<{ success: boolean; code: LoginErrorCode; user?: UserIdentity }>;
  sendSmsCode: (phone: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUser: (user: UserIdentity) => void;
  checkAuth: () => Promise<boolean>;
  clearLoginError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  loginError: null,
  loginType: 'password',

  login: async (phone: string, password: string) => {
    set({ isLoading: true, loginError: null, loginType: 'password' });
    try {
      const data = await api.auth.login(phone, password) as LoginResponse;
      if (data && data.token && data.user) {
        localStorage.setItem('token', data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          loginError: null,
        });
        return { success: true, code: 'SUCCESS', user: data.user };
      }
      set({ isLoading: false, loginError: 'UNKNOWN_ERROR' });
      return { success: false, code: 'UNKNOWN_ERROR' };
    } catch (error: any) {
      let errorCode: LoginErrorCode = 'UNKNOWN_ERROR';
      if (error?.error === 'PASSWORD_ERROR' || error?.message?.includes('密码')) {
        errorCode = 'PASSWORD_ERROR';
      } else if (error?.error === 'ACCOUNT_NOT_FOUND' || error?.message?.includes('账号不存在') || error?.message?.includes('不存在')) {
        errorCode = 'ACCOUNT_NOT_FOUND';
      } else if (error?.error === 'INSUFFICIENT_PERMISSIONS' || error?.message?.includes('权限')) {
        errorCode = 'INSUFFICIENT_PERMISSIONS';
      } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
        errorCode = 'NETWORK_ERROR';
      }
      set({ isLoading: false, loginError: errorCode });
      return { success: false, code: errorCode };
    }
  },

  loginBySms: async (phone: string, code: string) => {
    set({ isLoading: true, loginError: null, loginType: 'sms' });
    try {
      const data = await api.auth.loginBySms(phone, code) as LoginResponse;
      if (data && data.token && data.user) {
        localStorage.setItem('token', data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          loginError: null,
        });
        return { success: true, code: 'SUCCESS', user: data.user };
      }
      set({ isLoading: false, loginError: 'UNKNOWN_ERROR' });
      return { success: false, code: 'UNKNOWN_ERROR' };
    } catch (error: any) {
      let errorCode: LoginErrorCode = 'UNKNOWN_ERROR';
      if (error?.error === 'VERIFY_CODE_ERROR' || error?.message?.includes('验证码')) {
        errorCode = 'VERIFY_CODE_ERROR';
      } else if (error?.error === 'ACCOUNT_NOT_FOUND' || error?.message?.includes('账号不存在')) {
        errorCode = 'ACCOUNT_NOT_FOUND';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorCode = 'NETWORK_ERROR';
      }
      set({ isLoading: false, loginError: errorCode });
      return { success: false, code: errorCode };
    }
  },

  loginByFace: async (faceImage: string) => {
    set({ isLoading: true, loginError: null, loginType: 'face' });
    try {
      const data = await api.auth.loginByFace(faceImage) as LoginResponse;
      if (data && data.token && data.user) {
        localStorage.setItem('token', data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          loginError: null,
        });
        return { success: true, code: 'SUCCESS', user: data.user };
      }
      set({ isLoading: false, loginError: 'FACE_VERIFY_FAILED' });
      return { success: false, code: 'FACE_VERIFY_FAILED' };
    } catch (error: any) {
      let errorCode: LoginErrorCode = 'FACE_VERIFY_FAILED';
      if (error?.error === 'ACCOUNT_NOT_FOUND') {
        errorCode = 'ACCOUNT_NOT_FOUND';
      } else if (error?.code === 'NETWORK_ERROR') {
        errorCode = 'NETWORK_ERROR';
      }
      set({ isLoading: false, loginError: errorCode });
      return { success: false, code: errorCode };
    }
  },

  sendSmsCode: async (phone: string) => {
    try {
      await api.auth.sendSmsCode(phone);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error?.message || '发送失败' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, loginError: null });
  },

  setUser: (user: UserIdentity) => {
    set({ user });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (token && token !== 'demo-session') {
      try {
        const user = await api.auth.getCurrentUser() as UserIdentity;
        if (user) {
          set({ user, isAuthenticated: true, token });
          return true;
        }
      } catch {
        // token 无效，清除
      }
    }
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    return false;
  },

  clearLoginError: () => {
    set({ loginError: null });
  },
}));
