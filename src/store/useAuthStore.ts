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

const parseLoginError = (error: any): LoginErrorCode => {
  const errCode = error?.error || error?.data?.error;
  const errMsg = error?.message || '';

  if (errCode === 'PASSWORD_ERROR' || errMsg.includes('密码')) return 'PASSWORD_ERROR';
  if (errCode === 'ACCOUNT_NOT_FOUND' || errMsg.includes('账号不存在') || errMsg.includes('不存在')) return 'ACCOUNT_NOT_FOUND';
  if (errCode === 'VERIFY_CODE_ERROR' || errMsg.includes('验证码')) return 'VERIFY_CODE_ERROR';
  if (errCode === 'FACE_VERIFY_FAILED' || errMsg.includes('人脸')) return 'FACE_VERIFY_FAILED';
  if (errCode === 'INSUFFICIENT_PERMISSIONS' || errMsg.includes('权限')) return 'INSUFFICIENT_PERMISSIONS';
  if (errMsg.includes('Failed to fetch') || errMsg.includes('Network') || error?.code === 'NETWORK_ERROR') return 'NETWORK_ERROR';
  return 'UNKNOWN_ERROR';
};

const isLocalDemoHost = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
};

export const useAuthStore = create<AuthState>((set, get) => ({
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
      const errorCode = parseLoginError(error);
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
      const errorCode = parseLoginError(error);
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
      const errorCode = parseLoginError(error);
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
    const state = get();
    if (state.isAuthenticated && state.token && state.user) {
      return true;
    }
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await api.auth.getCurrentUser() as UserIdentity;
        if (user) {
          set({ user, isAuthenticated: true, token });
          return true;
        }
      } catch {
        localStorage.removeItem('token');
      }
    }

    if (isLocalDemoHost()) {
      try {
        const data = await api.auth.login('13900139000', 'admin123') as LoginResponse;
        if (data?.token && data?.user) {
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true });
          return true;
        }
      } catch {
        // Fall through to the normal unauthenticated state; manual login still works.
      }
    }

    set({ user: null, token: null, isAuthenticated: false });
    return false;
  },

  clearLoginError: () => {
    set({ loginError: null });
  },
}));
