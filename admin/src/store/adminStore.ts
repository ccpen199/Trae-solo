import { create } from 'zustand';

export interface AdminUser {
  id: string;
  name: string;
  role: 'admin' | 'reviewer';
  phone: string;
}

interface AdminState {
  token: string | null;
  user: AdminUser | null;
  setToken: (t: string | null) => void;
  setUser: (u: AdminUser | null) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  token: localStorage.getItem('admin_token') || null,
  user: localStorage.getItem('admin_user') ? JSON.parse(localStorage.getItem('admin_user')!) : null,
  setToken: (t) => {
    if (t) localStorage.setItem('admin_token', t);
    else localStorage.removeItem('admin_token');
    set({ token: t });
  },
  setUser: (u) => {
    if (u) localStorage.setItem('admin_user', JSON.stringify(u));
    else localStorage.removeItem('admin_user');
    set({ user: u });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ token: null, user: null });
  }
}));
