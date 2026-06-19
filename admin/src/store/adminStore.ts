import { create } from 'zustand';
import { AdminRole } from '../services/permissions';

export interface AdminUser {
  id: number;
  username: string;
  role: AdminRole;
  created_at?: string;
}

interface AdminState {
  token: string | null;
  admin: AdminUser | null;
  setAuth: (token: string, admin: AdminUser) => void;
  setRole: (role: AdminRole) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  token: localStorage.getItem('admin_token'),
  admin: (() => {
    const raw = localStorage.getItem('admin_info');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return { ...parsed, role: parsed.role || 'admin' };
    } catch {
      return null;
    }
  })(),
  setAuth: (token, admin) => {
    const normalized = { ...admin, role: admin.role || 'admin' };
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_info', JSON.stringify(normalized));
    set({ token, admin: normalized });
  },
  setRole: (role) => {
    const { admin } = get();
    if (!admin) return;
    const updated = { ...admin, role };
    localStorage.setItem('admin_info', JSON.stringify(updated));
    set({ admin: updated });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    set({ token: null, admin: null });
  },
}));
