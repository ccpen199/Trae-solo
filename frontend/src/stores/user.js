import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { userApi, messageApi } from '@/api';

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('pmcaff_user') || 'null'));
  const token = ref(localStorage.getItem('pmcaff_token') || '');
  const unreadCount = ref(0);

  const isLoggedIn = computed(() => !!token.value && !!user.value?.id);
  const isAdmin = computed(() => user.value?.role === 'admin');

  const setUser = (userData) => {
    user.value = userData;
    localStorage.setItem('pmcaff_user', JSON.stringify(userData));
  };

  const setToken = (tokenValue) => {
    token.value = tokenValue;
    localStorage.setItem('pmcaff_token', tokenValue);
  };

  const login = async (data) => {
    const res = await userApi.login(data);
    setUser(res.data.user);
    setToken(res.data.token);
    await fetchUnreadCount();
    return res;
  };

  const register = async (data) => {
    const res = await userApi.register(data);
    setUser(res.data.user);
    setToken(res.data.token);
    return res;
  };

  const logout = () => {
    user.value = null;
    token.value = '';
    unreadCount.value = 0;
    localStorage.removeItem('pmcaff_user');
    localStorage.removeItem('pmcaff_token');
  };

  const fetchUserInfo = async () => {
    if (!token.value) return;
    try {
      const res = await userApi.getMe();
      setUser(res.data.user);
    } catch (error) {
      console.error('Fetch user info error:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!token.value) return;
    try {
      const res = await messageApi.getUnreadCount();
      unreadCount.value = res.data.total || 0;
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  const updateProfile = async (data) => {
    const res = await userApi.updateMe(data);
    setUser(res.data.user);
    return res;
  };

  return {
    user,
    token,
    unreadCount,
    isLoggedIn,
    isAdmin,
    setUser,
    setToken,
    login,
    register,
    logout,
    fetchUserInfo,
    fetchUnreadCount,
    updateProfile
  };
});
