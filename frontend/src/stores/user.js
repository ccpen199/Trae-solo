import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import request from '@/utils/axios';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const isLoggedIn = computed(() => !!token.value);
  const isVip = computed(() => userInfo.value?.is_vip === 1);

  const setToken = (newToken) => {
    token.value = newToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
  };

  const setUserInfo = (info) => {
    userInfo.value = info;
    if (info) {
      localStorage.setItem('user', JSON.stringify(info));
    } else {
      localStorage.removeItem('user');
    }
  };

  const logout = () => {
    setToken('');
    setUserInfo(null);
  };

  const login = async (phone, code, loginType = 'phone') => {
    const res = await request.post('/user/login', { phone, code, loginType });
    setToken(res.data.token);
    setUserInfo(res.data.user);
    return res;
  };

  const sendCode = async (phone) => {
    return await request.post('/user/send-code', { phone });
  };

  const getUserInfo = async () => {
    const res = await request.get('/user/info');
    setUserInfo(res.data);
    return res;
  };

  const becomeVip = async () => {
    const res = await request.post('/user/become-vip');
    if (userInfo.value) {
      userInfo.value.is_vip = 1;
      localStorage.setItem('user', JSON.stringify(userInfo.value));
    }
    return res;
  };

  return {
    token,
    userInfo,
    isLoggedIn,
    isVip,
    setToken,
    setUserInfo,
    logout,
    login,
    sendCode,
    getUserInfo,
    becomeVip
  };
});
