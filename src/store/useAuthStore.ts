import { create } from 'zustand';

export type UserRole = 'museum' | 'operator' | 'visitor';

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  role: UserRole;
  scenicId: string;
  login: (username: string, password: string) => { success: boolean; error?: string; role?: UserRole };
  loginAsVisitor: () => void;
  logout: () => void;
}

const VALID_ACCOUNTS: Record<string, { password: string; role: UserRole; label: string }> = {
  museum_admin: { password: '123456', role: 'museum', label: '文博单位' },
  operator_admin: { password: '123456', role: 'operator', label: '景区运营方' },
};

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  username: '',
  role: 'visitor',
  scenicId: 'scenic-1',

  login: (username, password) => {
    const trimmed = username.trim();
    if (!trimmed) {
      return { success: false, error: '请输入用户名' };
    }
    if (!password.trim()) {
      return { success: false, error: '请输入密码' };
    }
    const account = VALID_ACCOUNTS[trimmed];
    if (!account) {
      return { success: false, error: '账号不存在，请检查用户名' };
    }
    if (account.password !== password) {
      return { success: false, error: '密码错误，请重新输入' };
    }
    set({
      isLoggedIn: true,
      username: trimmed,
      role: account.role,
    });
    return { success: true, role: account.role };
  },

  loginAsVisitor: () => {
    set({
      isLoggedIn: true,
      username: '游客',
      role: 'visitor',
    });
  },

  logout: () => {
    set({
      isLoggedIn: false,
      username: '',
      role: 'visitor',
    });
  },
}));
