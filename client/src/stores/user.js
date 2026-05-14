import { defineStore } from 'pinia';
import { userApi } from '../api';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('user') || 'null'),
    profile: null,
    isLoggedIn: !!localStorage.getItem('token')
  }),

  actions: {
    async login(username, password) {
      const res = await userApi.login({ username, password });
      if (res.code === 200) {
        this.token = res.data.token;
        this.userInfo = res.data.user;
        this.isLoggedIn = true;
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.userInfo));
        return true;
      }
      throw new Error(res.message);
    },

    async register(username, password, nickname) {
      const res = await userApi.register({ username, password, nickname });
      if (res.code === 200) {
        this.token = res.data.token;
        this.userInfo = res.data.user;
        this.isLoggedIn = true;
        localStorage.setItem('token', this.token);
        localStorage.setItem('user', JSON.stringify(this.userInfo));
        return true;
      }
      throw new Error(res.message);
    },

    async getProfile() {
      if (!this.isLoggedIn) return;
      const res = await userApi.getProfile();
      if (res.code === 200) {
        this.profile = res.data;
        return res.data;
      }
      return null;
    },

    async updateProfile(data) {
      const res = await userApi.updateProfile(data);
      if (res.code === 200) {
        this.userInfo = { ...this.userInfo, ...res.data };
        localStorage.setItem('user', JSON.stringify(this.userInfo));
        return true;
      }
      return false;
    },

    logout() {
      this.token = '';
      this.userInfo = null;
      this.profile = null;
      this.isLoggedIn = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});
