import type { User } from './types';

const AUTH_KEY = 'suzhou_admin_auth_v1';

export interface AuthSession {
  token: string;
  user: User;
  loginAt: number;
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.user || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getSession();
}

export function setSession(session: AuthSession) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

export async function apiLogin(username: string, password: string): Promise<
  | { success: true; token: string; user: User }
  | { success: false; message: string; code: string }
> {
  try {
    const resp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await resp.json().catch(() => null);
    if (resp.ok && data?.success && data?.data?.token && data?.data?.user) {
      return { success: true, token: data.data.token, user: data.data.user as User };
    }
    return {
      success: false,
      message: data?.message || (resp.status === 401 ? '账号或密码错误' : '登录失败'),
      code: data?.code || `HTTP_${resp.status}`,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : '网络异常，无法连接到认证服务',
      code: 'NETWORK_ERROR',
    };
  }
}
