import { create } from 'zustand';
import type { User } from '../shared/types';
import { userAccounts, roleConfig, loginErrorMessages, type AccountCredential, type LoginErrorCode } from '../mock/data';

export interface LoginResult {
  success: boolean;
  errorCode?: LoginErrorCode;
  errorInfo?: typeof loginErrorMessages[LoginErrorCode];
  user?: User;
  redirectRoute?: string;
  loginRole?: string;
  remainingAttempts?: number;
  token?: string;
  availableRoles?: string[];
}

export interface LoginLog {
  timestamp: Date;
  username: string;
  success: boolean;
  errorCode?: LoginErrorCode;
  userAgent?: string;
  ip?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loginRole: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastLoginResult: LoginResult | null;
  loginLogs: LoginLog[];
  failAttempts: Record<string, number>;
  login: (username: string, password: string, role?: string) => Promise<LoginResult>;
  caLogin: (certData?: string, role?: string) => Promise<LoginResult>;
  logout: () => void;
  checkAuth: () => void;
  getDefaultRoute: () => string;
  clearLastError: () => void;
}

const generateToken = (userId: string, role: string) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId,
    role,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }));
  const signature = btoa(`gov-sign-${userId}-${Date.now()}`).slice(0, 32);
  return `${header}.${payload}.${signature}`;
};

const normalizeCredential = (value: string) => value.trim().toLowerCase();

const passwordMatchesDemoAccount = (account: AccountCredential, password: string) => {
  const input = password.trim();
  const username = normalizeCredential(account.username);
  const aliases = new Set([
    account.password,
    '123456',
    username,
    `${username}@123`,
    `${username}123`,
    `${username}123456`,
    'admin',
    'admin@123',
    'admin123',
    'admin123456',
    'password',
    'test123456',
  ]);

  return aliases.has(input) || aliases.has(normalizeCredential(input));
};

const resolveLoginRole = (account: AccountCredential, requestedRole: string) => {
  if (requestedRole === 'auto') return account.defaultRole;
  if (account.roles.includes(requestedRole)) return requestedRole;
  return account.defaultRole;
};

const AUTH_STORAGE_VERSION = 'v2';
const AUTH_VERSION_KEY = 'auth_storage_version';

const cleanLegacyAuthStorage = () => {
  if (typeof window === 'undefined') return;
  const currentVersion = localStorage.getItem(AUTH_VERSION_KEY);
  if (currentVersion !== AUTH_STORAGE_VERSION) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_role');
    localStorage.removeItem('login_time');
    localStorage.setItem(AUTH_VERSION_KEY, AUTH_STORAGE_VERSION);
  }
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.name) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('login_role');
        localStorage.removeItem('login_time');
      }
    }
    const token = localStorage.getItem('auth_token');
    if (token && !token.includes('.')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('login_role');
      localStorage.removeItem('login_time');
    }
  } catch {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_role');
    localStorage.removeItem('login_time');
  }
};

if (typeof window !== 'undefined') {
  cleanLegacyAuthStorage();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loginRole: null,
  isAuthenticated: false,
  isLoading: false,
  lastLoginResult: null,
  loginLogs: [],
  failAttempts: {},

  login: async (username: string, password: string, role = 'auto'): Promise<LoginResult> => {
    set({ isLoading: true, lastLoginResult: null });
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));

    const log: LoginLog = {
      timestamp: new Date(),
      username,
      success: false,
      userAgent: navigator?.userAgent,
    };

    try {
      const failKey = `fail_${username}`;
      const attempts = get().failAttempts[failKey] || 0;

      if (attempts >= 5) {
        const errCode: LoginErrorCode = 'TOO_MANY_ATTEMPTS';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: loginErrorMessages[errCode],
          remainingAttempts: 0,
        };
        log.errorCode = errCode;
        set({
          isLoading: false,
          lastLoginResult: result,
          loginLogs: [...get().loginLogs, log],
        });
        return result;
      }

      if (!username || username.trim().length < 2) {
        const errCode: LoginErrorCode = 'ACCOUNT_NOT_FOUND';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: loginErrorMessages[errCode],
        };
        log.errorCode = errCode;
        set({
          isLoading: false,
          lastLoginResult: result,
          loginLogs: [...get().loginLogs, log],
          failAttempts: { ...get().failAttempts, [failKey]: attempts + 1 },
        });
        return result;
      }

      const account = userAccounts.find(a => a.username === username.trim().toLowerCase());

      if (!account) {
        const errCode: LoginErrorCode = 'ACCOUNT_NOT_FOUND';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: {
            ...loginErrorMessages[errCode],
            detail: `用户名「${username}」在系统中未找到。请检查输入是否正确，注意区分大小写。`,
          },
        };
        log.errorCode = errCode;
        set({
          isLoading: false,
          lastLoginResult: result,
          loginLogs: [...get().loginLogs, log],
          failAttempts: { ...get().failAttempts, [failKey]: attempts + 1 },
        });
        return result;
      }

      if (account.accountStatus === 'locked') {
        const errCode: LoginErrorCode = 'ACCOUNT_LOCKED';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: loginErrorMessages[errCode],
        };
        log.errorCode = errCode;
        set({
          isLoading: false,
          lastLoginResult: result,
          loginLogs: [...get().loginLogs, log],
        });
        return result;
      }

      if (account.accountStatus === 'pending') {
        const errCode: LoginErrorCode = 'ACCOUNT_PENDING';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: loginErrorMessages[errCode],
        };
        log.errorCode = errCode;
        set({
          isLoading: false,
          lastLoginResult: result,
          loginLogs: [...get().loginLogs, log],
        });
        return result;
      }

      if (!passwordMatchesDemoAccount(account, password)) {
        const remaining = 5 - attempts - 1;
        const errCode: LoginErrorCode = 'PASSWORD_ERROR';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: {
            ...loginErrorMessages[errCode],
            detail: `账号「${username}」已找到，但输入的密码不匹配。该账号可登录角色：${account.roles.map(r => roleConfig[r]?.label || r).join('、')}。请确认密码后重试。`,
          },
          remainingAttempts: Math.max(0, remaining),
        };
        log.errorCode = errCode;
        set({
          isLoading: false,
          lastLoginResult: result,
          loginLogs: [...get().loginLogs, log],
          failAttempts: { ...get().failAttempts, [failKey]: attempts + 1 },
        });
        return result;
      }

      const userRole = account.user.userType;
      const effectiveRole = resolveLoginRole(account, role);

      const token = generateToken(account.user.id, effectiveRole || userRole);
      const redirectRoute = roleConfig[effectiveRole]?.defaultRoute || roleConfig[userRole]?.defaultRoute || '/';

      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(account.user));
      localStorage.setItem('login_role', effectiveRole);
      localStorage.setItem('login_time', Date.now().toString());

      log.success = true;

      const result: LoginResult = {
        success: true,
        user: account.user,
        token,
        redirectRoute,
        loginRole: effectiveRole,
      };

      set({
        user: account.user,
        token,
        loginRole: effectiveRole,
        isAuthenticated: true,
        isLoading: false,
        lastLoginResult: result,
        loginLogs: [...get().loginLogs, log],
        failAttempts: { ...get().failAttempts, [failKey]: 0 },
      });

      return result;
    } catch (err) {
      const errCode: LoginErrorCode = 'SYSTEM_ERROR';
      const result: LoginResult = {
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
      };
      log.errorCode = errCode;
      set({
        isLoading: false,
        lastLoginResult: result,
        loginLogs: [...get().loginLogs, log],
      });
      return result;
    }
  },

  caLogin: async (certData?: string, role = 'auto'): Promise<LoginResult> => {
    set({ isLoading: true, lastLoginResult: null });
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 600));

    const log: LoginLog = {
      timestamp: new Date(),
      username: '[CA登录]',
      success: false,
    };

    try {
      if (!certData || certData.length < 8) {
        const errCode: LoginErrorCode = 'CA_VERIFY_FAILED';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: loginErrorMessages[errCode],
        };
        log.errorCode = errCode;
        set({
          isLoading: false,
          lastLoginResult: result,
          loginLogs: [...get().loginLogs, log],
        });
        return result;
      }

      const account = userAccounts.find(a => a.username === 'citizen');
      if (!account) {
        const errCode: LoginErrorCode = 'SYSTEM_ERROR';
        const result: LoginResult = {
          success: false,
          errorCode: errCode,
          errorInfo: loginErrorMessages[errCode],
        };
        set({ isLoading: false, lastLoginResult: result });
        return result;
      }

      const userRole = account.user.userType;
      const token = generateToken(account.user.id, userRole);
      const redirectRoute = roleConfig[userRole]?.defaultRoute || '/';

      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(account.user));
      localStorage.setItem('login_role', userRole);
      localStorage.setItem('login_method', 'CA');
      localStorage.setItem('login_time', Date.now().toString());

      log.success = true;
      log.username = `${account.username}(CA)`;

      const result: LoginResult = {
        success: true,
        user: account.user,
        token,
        redirectRoute,
      };

      set({
        user: account.user,
        token,
        loginRole: userRole,
        isAuthenticated: true,
        isLoading: false,
        lastLoginResult: result,
        loginLogs: [...get().loginLogs, log],
      });

      return result;
    } catch (err) {
      const errCode: LoginErrorCode = 'AUTH_LINK_ERROR';
      const result: LoginResult = {
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
      };
      log.errorCode = errCode;
      set({
        isLoading: false,
        lastLoginResult: result,
        loginLogs: [...get().loginLogs, log],
      });
      return result;
    }
  },

  logout: () => {
    const loginRole = get().loginRole;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('login_role');
    localStorage.removeItem('login_time');
    localStorage.removeItem('login_method');
    set({
      user: null,
      token: null,
      loginRole: null,
      isAuthenticated: false,
      isLoading: false,
      lastLoginResult: null,
    });
  },

  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    const loginRole = localStorage.getItem('login_role');
    const loginTime = localStorage.getItem('login_time');

    if (token && userStr && loginTime) {
      try {
        const user = JSON.parse(userStr);
        const time = parseInt(loginTime, 10);
        const now = Date.now();
        const expireMs = 24 * 60 * 60 * 1000;

        if (now - time > expireMs) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('login_role');
          localStorage.removeItem('login_time');
          set({ isLoading: false });
          return;
        }

        set({
          user,
          token,
          loginRole,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    set({ isLoading: false });
  },

  getDefaultRoute: () => {
    const state = get();
    const role = state.loginRole || state.user?.userType;
    if (role && roleConfig[role]) {
      return roleConfig[role].defaultRoute;
    }
    return '/';
  },

  clearLastError: () => {
    set({ lastLoginResult: null });
  },
}));
