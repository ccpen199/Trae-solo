import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/api';
import type { User } from '@/types';

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const isLoggedIn = computed(() => !!user.value);

  async function login(username: string, password: string) {
    const result = await api.login(username, password);
    api.setToken(result.token);
    user.value = result.user;
    return result;
  }

  async function register(username: string, password: string, nickname?: string) {
    const result = await api.register(username, password, nickname);
    return result;
  }

  async function logout() {
    try {
      await api.logoutApi();
    } catch {
      // 忽略错误
    }
    user.value = null;
  }

  async function fetchProfile() {
    if (!api.getToken()) {
      user.value = null;
      return null;
    }
    
    try {
      const profile = await api.getProfile();
      user.value = profile;
      return profile;
    } catch {
      user.value = null;
      api.logout();
      return null;
    }
  }

  function initFromStorage() {
    const token = api.getToken();
    if (token) {
      fetchProfile();
    }
  }

  return {
    user,
    isLoggedIn,
    login,
    register,
    logout,
    fetchProfile,
    initFromStorage,
  };
});
