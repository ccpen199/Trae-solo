import { create } from 'zustand';

interface AdminState {
  token: string | null;
  admin: any | null;
  setAuth: (token: string, admin: any) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  token: localStorage.getItem('admin_token'),
  admin: localStorage.getItem('admin_info') ? JSON.parse(localStorage.getItem('admin_info')!) : null,
  setAuth: (token, admin) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_info', JSON.stringify(admin));
    set({ token, admin });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    set({ token: null, admin: null });
  },
}));
