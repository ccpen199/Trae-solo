import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/utils/api';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const userInfo = ref<any>(null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => userInfo.value?.userType === 'admin');
  const userType = computed(() => userInfo.value?.userType || '');
  const realName = computed(() => userInfo.value?.realName || userInfo.value?.username || '');
  const policeVerified = computed(() => userInfo.value?.police_verified === 1 || userInfo.value?.policeVerified === true);
  const businessName = computed(() => userInfo.value?.business_name || userInfo.value?.businessName || '');

  const initFromStorage = () => {
    const savedToken = localStorage.getItem('token');
    const savedInfo = localStorage.getItem('userInfo');
    if (savedToken) {
      token.value = savedToken;
    }
    if (savedInfo) {
      try {
        userInfo.value = JSON.parse(savedInfo);
      } catch {
        userInfo.value = null;
      }
    }
  };

  const login = async (username: string, password: string, loginType: string = 'natural') => {
    const res = await api.post('/auth/login', { username, password, loginType });
    if (res.code === 200) {
      token.value = res.data.token;
      userInfo.value = res.data.userInfo;
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo));
      try {
        await fetchProfile();
      } catch {
        // profile fetch failure should not block login
      }
    }
    return res;
  };

  const logout = () => {
    token.value = null;
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  };

  const restoreUserInfo = () => {
    const saved = localStorage.getItem('userInfo');
    if (saved) {
      try {
        userInfo.value = JSON.parse(saved);
      } catch {
        userInfo.value = null;
      }
    }
  };

  const fetchProfile = async () => {
    const res = await api.get('/users/profile');
    if (res.code === 200) {
      userInfo.value = { ...userInfo.value, ...res.data };
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
    }
    return res;
  };

  initFromStorage();

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    userType,
    realName,
    policeVerified,
    businessName,
    login,
    logout,
    restoreUserInfo,
    fetchProfile
  };
});
