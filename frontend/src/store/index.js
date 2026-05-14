import { create } from 'zustand';
import { TOKEN_KEY, api } from '../utils/request';

const useStore = create((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
  isLoading: false,
  error: null,

  isLoggedIn: () => !!get().token,

  login: async (account, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.post('/auth/login', {
        taobao_account: account,
        password
      });
      
      const token = result?.data?.token;
      const user = result?.data?.user;

      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        set({ token, user, isLoading: false });
        return { success: true, user };
      }
      return { success: false, message: '登录失败' };
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, message: err.message || '登录失败' };
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },

  fetchUserProfile: async () => {
    if (!get().token) return;
    
    try {
      const result = await api.get('/auth/profile');
      set({ user: result?.data });
    } catch (err) {
      console.error('获取用户信息失败:', err);
    }
  },

  updateNotificationPermission: async (enabled) => {
    try {
      await api.put('/auth/notification-permission', { enabled });
      set(state => ({
        user: state.user ? { ...state.user, notification_permission: enabled ? 1 : 0 } : null
      }));
      return true;
    } catch (err) {
      console.error('更新通知权限失败:', err);
      return false;
    }
  }
}));

export default useStore;
