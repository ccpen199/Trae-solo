import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'accountant' | 'user';
  language: 'zh' | 'en';
  timezone: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setLanguage: (lang: 'zh' | 'en') => void;
  setTimezone: (tz: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          const err = new Error(data.error || data.message || 'Login failed') as any;
          err.status = response.status;
          throw err;
        }
        console.log('[Auth] Login successful:', data.data.user);
        set({ user: data.data.user, token: data.data.token });
      },
      register: async (email: string, password: string, fullName: string) => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            language: 'zh',
            timezone: 'Australia/Sydney',
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          const err = new Error(data.error || data.message || 'Register failed') as any;
          err.status = response.status;
          throw err;
        }
        console.log('[Auth] Register successful:', data.data.user);
        set({ user: data.data.user, token: data.data.token });
      },
      logout: () => {
        window.localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      setLanguage: (lang: 'zh' | 'en') => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, language: lang } });
          fetch('/api/i18n/set-language', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`,
            },
            body: JSON.stringify({ language: lang }),
          });
        }
      },
      setTimezone: (tz: string) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, timezone: tz } });
          fetch('/api/i18n/set-timezone', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${get().token}`,
            },
            body: JSON.stringify({ timezone: tz }),
          });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
