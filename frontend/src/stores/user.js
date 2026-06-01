import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api';

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(JSON.parse(localStorage.getItem('user') || 'null'));

  const login = async (username, password) => {
    const res = await api.post('/users/login', { username, password });
    currentUser.value = res.data;
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  };

  const logout = () => {
    currentUser.value = null;
    localStorage.removeItem('user');
  };

  return { currentUser, login, logout };
});
