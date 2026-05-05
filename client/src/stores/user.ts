import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { User, RoleCode } from '@/types';
import { get } from '@/utils/request';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role.code === RoleCode.ADMIN);

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  function setUser(newUser: User) {
    user.value = newUser;
    localStorage.setItem('user', JSON.stringify(newUser));
  }

  function clearAuth() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function restoreFromStorage() {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken) {
      token.value = storedToken;
    }

    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  async function fetchUserInfo() {
    if (!token.value) {
      return false;
    }

    const response = await get<User>('/user/profile');
    if (response.success && response.data) {
      setUser(response.data);
      return true;
    }

    clearAuth();
    return false;
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    setToken,
    setUser,
    clearAuth,
    restoreFromStorage,
    fetchUserInfo,
  };
});
