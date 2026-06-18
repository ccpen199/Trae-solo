import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  role: 'admin' | 'editor';
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  username: '',
  role: 'editor',
  login: (username, _password) => {
    if (!username.trim()) return false;
    set({
      isLoggedIn: true,
      username,
      role: username.includes('admin') ? 'admin' : 'editor',
    });
    return true;
  },
  logout: () => {
    set({
      isLoggedIn: false,
      username: '',
      role: 'editor',
    });
  },
}));
