import { create } from 'zustand';
import { post } from '../utils/request';

interface Admin {
  id: string;
  username: string;
  role: string;
}

interface AdminState {
  admin: Admin | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  isLoggedIn: false,
  loading: false,

  login: async (username: string, password: string) => {
    try {
      set({ loading: true });
      const result: any = await post('/admin/login', { username, password });
      if (result.success && result.admin) {
        localStorage.setItem('adminToken', result.admin.id);
        localStorage.setItem('adminInfo', JSON.stringify(result.admin));
        set({ admin: result.admin, isLoggedIn: true });
        return { success: true };
      }
      return { success: false, message: result.message || '登录失败' };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    set({ admin: null, isLoggedIn: false });
  },
}));
