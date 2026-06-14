import { create } from 'zustand';
import type { UserInfo, UserRole } from '@/types';
import { defaultUser } from '@/utils/mockData';

const STORAGE_KEY = 'tc_auth_state';

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  currentRole: UserRole;
  login: (role: UserRole, phone?: string) => void;
  logout: () => void;
  restoreSession: () => boolean;
}

function saveToStorage(state: Partial<AuthState>) {
  try {
    const data = {
      user: state.user,
      currentRole: state.currentRole,
      isAuthenticated: state.isAuthenticated,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save auth state:', e);
  }
}

function loadFromStorage(): Partial<AuthState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.user || !data.currentRole) return null;
    if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

const initialState = (() => {
  const saved = loadFromStorage();
  if (saved && saved.user && saved.isAuthenticated) {
    return {
      user: saved.user as UserInfo,
      isAuthenticated: true,
      currentRole: (saved.currentRole as UserRole) || 'SHIPPER',
    };
  }
  return {
    user: null,
    isAuthenticated: false,
    currentRole: 'SHIPPER' as UserRole,
  };
})();

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  login: (role, _phone) => {
    const user = defaultUser[role];
    const newState = {
      user,
      isAuthenticated: true,
      currentRole: role,
    };
    set(newState);
    saveToStorage(newState);
  },
  logout: () => {
    set({ user: null, isAuthenticated: false, currentRole: 'SHIPPER' });
    localStorage.removeItem(STORAGE_KEY);
  },
  restoreSession: () => {
    const saved = loadFromStorage();
    if (saved && saved.user && saved.isAuthenticated) {
      set({
        user: saved.user as UserInfo,
        isAuthenticated: true,
        currentRole: (saved.currentRole as UserRole) || 'SHIPPER',
      });
      return true;
    }
    return false;
  },
}));
