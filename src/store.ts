import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role: string;
  real_name?: string;
  is_verified: number;
  is_signed: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  initialize: () => void;
}

const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  
  initialize: () => {
    const token = getStorageItem('token');
    const userStr = getStorageItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      } catch {
        set({ token: null, user: null, isAuthenticated: false });
      }
    }
  },
  
  login: (token, user) => {
    setStorageItem('token', token);
    setStorageItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    removeStorageItem('token');
    removeStorageItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  updateUser: (userData) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...userData } : null;
      if (updatedUser) {
        setStorageItem('user', JSON.stringify(updatedUser));
      }
      return { user: updatedUser };
    });
  },
}));
