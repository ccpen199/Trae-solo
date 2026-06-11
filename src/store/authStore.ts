import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';
import type { User, LoginRequest } from '../../shared/types';

export type LoginErrorType =
  | 'invalid_credentials'
  | 'account_disabled'
  | 'network_error'
  | 'server_error'
  | 'unknown';

interface AuthState {
  user: (User & { permissions: string[] }) | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  errorType: LoginErrorType | null;
  lastLoginAt: string | null;
  login: (data: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  ensureDemoSession: () => void;
  hasPermission: (permission: string) => boolean;
  resetState: () => void;
}

const DEMO_TOKEN = 'demo-local-token';
const DEMO_REFRESH_TOKEN = 'demo-local-refresh-token';
const DEMO_USER: User & { permissions: string[] } = {
  id: 'demo-admin',
  username: 'admin',
  realName: '系统管理员',
  email: 'admin@wenlv.gov.cn',
  phone: '13800000001',
  role: 'super_admin',
  organization: '文化和旅游部',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  status: 'active',
  createdAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  permissions: ['*'],
};

const writeLocalAuth = (token: string, user: User & { permissions: string[] }) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('wenlv_token', token);
  localStorage.setItem('wenlv_user', JSON.stringify(user));
};

const clearLocalAuth = () => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem('wenlv_token');
  localStorage.removeItem('wenlv_user');
};

const classifyError = (err: unknown): { message: string; type: LoginErrorType } => {
  if (err instanceof Error) {
    const msg = err.message || '';
    if (msg.includes('用户名或密码') || msg.includes('密码错误') || msg.includes('credentials')) {
      return { message: '账号或密码不正确，请核实后重试', type: 'invalid_credentials' };
    }
    if (msg.includes('禁用') || msg.includes('disabled') || msg.includes('banned')) {
      return { message: '该账号已被禁用，请联系管理员', type: 'account_disabled' };
    }
    if (msg.includes('Network Error') || msg.includes('网络') || msg.includes('timeout') || msg.includes('ERR_')) {
      return { message: '无法连接到服务器，请检查网络或刷新页面', type: 'network_error' };
    }
    if (msg.includes('500') || msg.includes('服务器') || msg.includes('server') || (err as any).status >= 500) {
      return { message: '服务器暂时不可用，请稍后重试', type: 'server_error' };
    }
    return { message: msg || '登录失败', type: 'unknown' };
  }
  return { message: '登录失败，请稍后重试', type: 'unknown' };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,
      errorType: null,
      lastLoginAt: null,

      login: async (data: LoginRequest): Promise<boolean> => {
        console.log('[AuthStore] login start:', data.username);
        set({ loading: true, error: null, errorType: null });
        try {
          const response = await authApi.login(data);
          console.log('[AuthStore] login response:', JSON.stringify(response).substring(0, 200));

          if (!response || !response.data) {
            console.error('[AuthStore] unexpected response:', response);
            set({ loading: false, error: '服务器返回数据格式异常', errorType: 'server_error' });
            return false;
          }

          const { token, refreshToken, user, permissions } = response.data;

          if (!token || !user) {
            console.error('[AuthStore] missing token or user:', { token: !!token, user: !!user });
            set({ loading: false, error: '登录返回数据不完整', errorType: 'server_error' });
            return false;
          }

          console.log('[AuthStore] login success:', user.realName, user.role, 'perms:', permissions?.length || 0);

          const userWithPermissions = { ...user, permissions: permissions || [] };
          writeLocalAuth(token, userWithPermissions);

          set({
            token,
            refreshToken: refreshToken || null,
            user: userWithPermissions,
            loading: false,
            error: null,
            errorType: null,
            lastLoginAt: new Date().toISOString(),
          });

          return true;
        } catch (err: any) {
          console.error('[AuthStore] login error:', err?.message, err?.status, err?.code);
          const { message, type } = classifyError(err);
          set({
            error: message,
            errorType: type,
            loading: false,
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // logout 失败不影响本地状态清除
        } finally {
          clearLocalAuth();
          set({
            user: null,
            token: null,
            refreshToken: null,
            error: null,
            errorType: null,
          });
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await authApi.getCurrentUser();
          const result = response.data;
          if (result && result.user) {
            set({ user: { ...result.user, permissions: result.permissions || [] } });
          }
        } catch (err) {
          console.error('[AuthStore] fetchCurrentUser error:', err);
          if ((err as any)?.status === 401 || (err as any)?.response?.status === 401) {
            set({ user: null, token: null, refreshToken: null });
            clearLocalAuth();
          }
        }
      },

      clearError: () => set({ error: null, errorType: null }),

      ensureDemoSession: () => {
        writeLocalAuth(DEMO_TOKEN, DEMO_USER);
        set({
          user: DEMO_USER,
          token: DEMO_TOKEN,
          refreshToken: DEMO_REFRESH_TOKEN,
          loading: false,
          error: null,
          errorType: null,
          lastLoginAt: new Date().toISOString(),
        });
      },

      resetState: () => {
        clearLocalAuth();
        set({
          user: null,
          token: null,
          refreshToken: null,
          loading: false,
          error: null,
          errorType: null,
          lastLoginAt: null,
        });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        if (user.permissions?.includes('*')) return true;
        return user.permissions?.includes(permission) || false;
      },
    }),
    {
      name: 'wenlv-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        lastLoginAt: state.lastLoginAt,
      }),
    },
  ),
);
