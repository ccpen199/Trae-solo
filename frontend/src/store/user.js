import { defineStore } from 'pinia';
import { login, logout, getCurrentUser } from '@/api/auth';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    menus: JSON.parse(localStorage.getItem('menus') || '[]'),
    permissions: JSON.parse(localStorage.getItem('permissions') || '[]')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    username: (state) => state.userInfo?.realName || '',
    hasPermission: (state) => (code) => {
      return state.permissions.includes(code) || state.permissions.includes('SUPER_ADMIN');
    }
  },

  actions: {
    async login(loginForm) {
      const result = await login(loginForm);
      const { token, user, menus, permissions } = result.data;
      
      this.token = token;
      this.userInfo = user;
      this.menus = menus;
      this.permissions = permissions;

      localStorage.setItem('token', token);
      localStorage.setItem('userInfo', JSON.stringify(user));
      localStorage.setItem('menus', JSON.stringify(menus));
      localStorage.setItem('permissions', JSON.stringify(permissions));

      return result;
    },

    async logout() {
      try {
        await logout();
      } catch (e) {
        console.log('logout error:', e);
      }
      
      this.token = '';
      this.userInfo = null;
      this.menus = [];
      this.permissions = [];

      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('menus');
      localStorage.removeItem('permissions');
    },

    async getUserInfo() {
      const result = await getCurrentUser();
      const { user, menus, permissions } = result.data;
      
      this.userInfo = user;
      this.menus = menus;
      this.permissions = permissions;

      localStorage.setItem('userInfo', JSON.stringify(user));
      localStorage.setItem('menus', JSON.stringify(menus));
      localStorage.setItem('permissions', JSON.stringify(permissions));

      return result;
    }
  }
});
