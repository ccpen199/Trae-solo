import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth';
import type { User, UserRole } from '@/types';

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);
  const permissions = ref<string[]>([]);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role);
  const userName = computed(() => user.value?.name);

  async function login(username: string, password: string) {
    const response = await authApi.login({ username, password });
    if (response.data) {
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  }

  function logout() {
    token.value = null;
    user.value = null;
    permissions.value = [];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function restoreSession() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);
      } catch {
        logout();
      }
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return null;
    try {
      const response = await authApi.getCurrentUser();
      if (response.data) {
        user.value = response.data;
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch {
      logout();
      return null;
    }
  }

  function hasRole(role: UserRole | UserRole[]): boolean {
    if (!user.value) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.value.role);
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    userRole,
    userName,
    login,
    logout,
    restoreSession,
    fetchCurrentUser,
    hasRole,
  };
});
