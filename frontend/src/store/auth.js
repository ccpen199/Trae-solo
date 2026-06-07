import { create } from 'zustand';
import api from '../services/api.js';

const oauthHeader = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

const encodeFormData = (data) => {
  return Object.keys(data)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
};

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error: null,

  isAuthenticated: () => {
    const { accessToken, user } = get();
    return !!(accessToken && user);
  },

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      if (!username || !password) {
        throw new Error('用户名和密码不能为空');
      }

      const response = await api.post('/oauth/token',
        encodeFormData({
          grant_type: 'password',
          client_id: 'platform-admin',
          client_secret: 'platform-secret-2024',
          username,
          password
        }),
        { headers: oauthHeader }
      );

      const { access_token, refresh_token, user } = response.data;

      if (!access_token || !user) {
        throw new Error('认证响应格式错误');
      }

      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        accessToken: access_token,
        refreshToken: refresh_token,
        user,
        loading: false
      });

      return { success: true, user };
    } catch (e) {
      let errorMsg = '登录失败';
      let errorType = 'unknown';

      if (!e.response) {
        errorMsg = '网络连接失败，请检查后端服务是否启动';
        errorType = 'network';
      } else if (e.response.status === 400) {
        const err = e.response.data;
        if (err.error === 'invalid_grant') {
          errorMsg = '用户名或密码错误';
          errorType = 'credentials';
        } else if (err.error === 'invalid_client') {
          errorMsg = '客户端认证失败';
          errorType = 'client';
        } else {
          errorMsg = err.error_description || err.error || '请求参数错误';
          errorType = 'request';
        }
      } else if (e.response.status === 401) {
        errorMsg = '认证失败，请联系管理员';
        errorType = 'auth';
      } else if (e.response.status >= 500) {
        errorMsg = '服务器内部错误';
        errorType = 'server';
      } else if (e.message) {
        errorMsg = e.message;
      }

      set({ error: errorMsg, loading: false });
      return { success: false, error: errorMsg, errorType };
    }
  },

  refreshToken: async () => {
    const { refreshToken: rt } = get();
    if (!rt) return false;

    try {
      const response = await api.post('/oauth/token',
        encodeFormData({
          grant_type: 'refresh_token',
          client_id: 'platform-admin',
          client_secret: 'platform-secret-2024',
          refresh_token: rt
        }),
        { headers: oauthHeader }
      );

      const { access_token, refresh_token } = response.data;

      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);

      set({ accessToken: access_token, refreshToken: refresh_token });
      return true;
    } catch (e) {
      get().logout();
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ accessToken: null, refreshToken: null, user: null });
  },

  clearError: () => {
    set({ error: null });
  },

  fetchUserInfo: async () => {
    try {
      const response = await api.get('/userinfo');
      set({ user: response.data });
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (e) {
      return null;
    }
  }
}));
