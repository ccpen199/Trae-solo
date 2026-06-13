import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LoginResponse } from '@shared/types/auth';
import { authApi } from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '');
  const userInfo = ref<LoginResponse['userInfo'] | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  function setTokens(accessToken: string, refresh: string) {
    token.value = accessToken;
    refreshToken.value = refresh;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refresh);
  }

  function clearTokens() {
    token.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  async function login() {
    try {
      const res = await authApi.getLoginUrl();
      window.location.href = res.redirectUrl;
    } catch (e) {
      console.error('获取登录地址失败', e);
    }
  }

  async function callback(code: string, state: string) {
    const res = await authApi.callback(code, state);
    setTokens(res.token, res.refreshToken);
    userInfo.value = res.userInfo;
  }

  async function refresh() {
    try {
      const res = await authApi.refresh(refreshToken.value);
      setTokens(res.token, res.refreshToken);
    } catch {
      clearTokens();
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clearTokens();
      window.location.href = '/';
    }
  }

  function checkAuth(): boolean {
    return !!token.value;
  }

  return {
    token,
    refreshToken,
    userInfo,
    isAuthenticated,
    login,
    callback,
    refresh,
    logout,
    checkAuth,
  };
});
