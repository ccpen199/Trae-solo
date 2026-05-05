import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || '');

  const isLoggedIn = computed(() => !!token.value && !!user.value);

  const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  };

  const setUser = (newUser) => {
    user.value = newUser;
  };

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    setToken(res.data.token);
    setUser(res.data.user);
    return res;
  };

  const register = async (credentials) => {
    const res = await api.post('/auth/register', credentials);
    setToken(res.data.token);
    setUser(res.data.user);
    return res;
  };

  const logout = () => {
    user.value = null;
    token.value = '';
    localStorage.removeItem('token');
  };

  const fetchProfile = async () => {
    if (!token.value) return;
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
    } catch (error) {
      logout();
    }
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    return res;
  };

  const changePassword = async (data) => {
    return await api.put('/auth/password', data);
  };

  return {
    user,
    token,
    isLoggedIn,
    setToken,
    setUser,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    changePassword
  };
});
