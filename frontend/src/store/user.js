import { defineStore } from 'pinia';
import request from '@/utils/request';

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: JSON.parse(localStorage.getItem('userInfo') || '{}'),
    token: localStorage.getItem('token') || ''
  }),

  actions: {
    async login(params) {
      const res = await request.post('/user/login', params);
      this.token = res.token;
      this.userInfo = res.user;
      localStorage.setItem('token', res.token);
      localStorage.setItem('userInfo', JSON.stringify(res.user));
      return res;
    },

    async getUserInfo() {
      const res = await request.get('/user/info');
      this.userInfo = res;
      localStorage.setItem('userInfo', JSON.stringify(res));
      return res;
    },

    async updateUserInfo(data) {
      const res = await request.put('/user/info', data);
      this.userInfo = res;
      localStorage.setItem('userInfo', JSON.stringify(res));
      return res;
    },

    logout() {
      this.token = '';
      this.userInfo = {};
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    }
  }
});
