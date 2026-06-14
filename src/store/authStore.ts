import { create } from 'zustand';
import type { UserInfo, UserRole } from '@/types';

const STORAGE_KEY = 'tc_auth_state';

const DEMO_USERS: Record<UserRole, UserInfo> = {
  SHIPPER: {
    id: 'shipper_demo',
    role: 'SHIPPER',
    name: '张经理',
    phone: '13800000001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shipper',
    company: '上海鲜达供应链管理有限公司',
  },
  DRIVER: {
    id: 'drv_demo',
    role: 'DRIVER',
    name: '李师傅',
    phone: '13800000002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=driver',
    company: '沪A·D8823F',
  },
  ADMIN: {
    id: 'admin_demo',
    role: 'ADMIN',
    name: '调度中心',
    phone: '021-88880000',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    company: '运联智能平台',
  },
};

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  currentRole: UserRole;
  login: (role: UserRole, phone?: string) => { success: boolean; error?: string };
  logout: () => void;
  restoreSession: () => boolean;
}

function saveToStorage(data: { user: UserInfo | null; isAuthenticated: boolean; currentRole: UserRole }) {
  try {
    const payload = JSON.stringify({
      user: data.user,
      currentRole: data.currentRole,
      isAuthenticated: data.isAuthenticated,
      timestamp: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, payload);
    console.log('[AuthStore] saveToStorage OK, length=', payload.length);
  } catch (e) {
    console.error('[AuthStore] saveToStorage FAILED:', e);
  }
}

function loadFromStorage(): { user: UserInfo; currentRole: UserRole; isAuthenticated: boolean } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.user || !data.currentRole || !data.isAuthenticated) return null;
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data as { user: UserInfo; currentRole: UserRole; isAuthenticated: boolean };
  } catch (e) {
    console.error('[AuthStore] loadFromStorage FAILED:', e);
    return null;
  }
}

const savedState = loadFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: savedState?.user ?? null,
  isAuthenticated: savedState?.isAuthenticated ?? false,
  currentRole: savedState?.currentRole ?? 'SHIPPER',

  login: (role: UserRole, _phone?: string) => {
    try {
      console.log('[AuthStore] login() called with role=', role);

      const user = DEMO_USERS[role];
      if (!user) {
        const err = `DEMO_USERS[${role}] is undefined! Available keys: ${Object.keys(DEMO_USERS).join(',')}`;
        console.error('[AuthStore] ' + err);
        return { success: false, error: err };
      }

      console.log('[AuthStore] user resolved:', user.name, user.role, user.phone);

      const newState = {
        user,
        isAuthenticated: true,
        currentRole: role,
      };

      set(newState);
      console.log('[AuthStore] set() called, verifying...');

      const verifyState = get();
      console.log('[AuthStore] after set():', {
        isAuthenticated: verifyState.isAuthenticated,
        userName: verifyState.user?.name,
        userRole: verifyState.user?.role,
      });

      if (!verifyState.isAuthenticated || !verifyState.user) {
        const err = 'set() did not update state correctly';
        console.error('[AuthStore] ' + err);
        return { success: false, error: err };
      }

      saveToStorage(newState);

      const lsCheck = localStorage.getItem(STORAGE_KEY);
      if (!lsCheck) {
        const err = 'localStorage write failed';
        console.error('[AuthStore] ' + err);
        return { success: false, error: err };
      }

      console.log('[AuthStore] login() SUCCESS');
      return { success: true };
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      console.error('[AuthStore] login() EXCEPTION:', errMsg);
      return { success: false, error: errMsg };
    }
  },

  logout: () => {
    console.log('[AuthStore] logout()');
    set({ user: null, isAuthenticated: false, currentRole: 'SHIPPER' });
    localStorage.removeItem(STORAGE_KEY);
  },

  restoreSession: () => {
    try {
      const saved = loadFromStorage();
      if (saved && saved.user && saved.isAuthenticated) {
        set({
          user: saved.user,
          isAuthenticated: true,
          currentRole: saved.currentRole,
        });
        console.log('[AuthStore] restoreSession() SUCCESS, role=', saved.currentRole);
        return true;
      }
      console.log('[AuthStore] restoreSession() no valid session');
      return false;
    } catch (e: any) {
      console.error('[AuthStore] restoreSession() EXCEPTION:', e);
      return false;
    }
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__authStore = useAuthStore;
  (window as any).__demoUsers = DEMO_USERS;
}
