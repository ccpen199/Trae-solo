import { create } from 'zustand';

interface Admin {
  id: number;
  username: string;
  role: 'admin' | 'operator' | 'risk' | 'finance';
  createdAt: string;
}

interface AuthState {
  token: string | null;
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  admin: typeof window !== 'undefined' ? (() => { try { const s = localStorage.getItem('admin'); return s ? JSON.parse(s) : null; } catch { return null; } })() : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  
  login: (token: string, admin: Admin) => {
    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(admin));
    set({ token, admin, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    set({ token: null, admin: null, isAuthenticated: false });
  },
}));

export function checkAuth(): { isAuthenticated: boolean; admin: Admin | null } {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, admin: null };
  }
  try {
    const token = localStorage.getItem('token');
    const adminStr = localStorage.getItem('admin');
    return {
      isAuthenticated: !!token,
      admin: adminStr ? JSON.parse(adminStr) : null,
    };
  } catch {
    return { isAuthenticated: false, admin: null };
  }
}
