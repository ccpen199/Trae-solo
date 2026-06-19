import { create } from 'zustand';
import request from '../utils/request';

interface UserState {
  token: string | null;
  user: any | null;
  login: (params?: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  token: localStorage.getItem('user_token'),
  user: localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')!) : null,

  login: async (params?: any) => {
    const deviceInfo: any = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    };

    const inviterId = localStorage.getItem('inviter_id');
    const result: any = await request.post('/user/login', {
      ...params,
      deviceInfo,
      inviterId: inviterId ? parseInt(inviterId) : undefined,
    });

    localStorage.setItem('user_token', result.token);
    localStorage.setItem('user_info', JSON.stringify(result.user));
    if (inviterId) localStorage.removeItem('inviter_id');

    set({ token: result.token, user: result.user });
    return result;
  },

  logout: () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    set({ token: null, user: null });
  },

  refreshUser: async () => {
    try {
      const user: any = await request.get('/user/profile');
      localStorage.setItem('user_info', JSON.stringify(user));
      set({ user });
    } catch (e) {}
  },
}));
