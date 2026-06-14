import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { LoginResponse } from '@shared/types/auth';
import { authApi } from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '');
  const userInfo = ref<LoginResponse['userInfo'] | null>(null);
  const initFromStorage = () => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      try { userInfo.value = JSON.parse(stored); } catch { userInfo.value = null; }
    }
  };
  initFromStorage();

  const isAuthenticated = computed(() => !!token.value);

  function setTokens(accessToken: string, refresh: string) {
    token.value = accessToken;
    refreshToken.value = refresh;
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refresh);
  }

  function setUserInfo(info: LoginResponse['userInfo']) {
    userInfo.value = info;
    localStorage.setItem('userInfo', JSON.stringify(info));
  }

  function clearTokens() {
    token.value = '';
    refreshToken.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  }

  async function login() {
    try {
      const res = await authApi.getLoginUrl();
      window.location.href = res.redirectUrl;
    } catch (e) {
      console.error('获取登录地址失败', e);
    }
  }

  function demoLogin() {
    const mockUser: LoginResponse = {
      token: 'demo-access-token-' + Date.now(),
      refreshToken: 'demo-refresh-token-' + Date.now(),
      userInfo: {
        id: 'GX20240001001',
        nameMasked: '张*三',
        idCardMasked: '450***********1234',
        socialCardMasked: 'GX****1234',
        phoneMasked: '138****5678',
        insureStatus: 'NORMAL',
        region: '南宁市青秀区',
      },
    };
    setTokens(mockUser.token, mockUser.refreshToken);
    setUserInfo(mockUser.userInfo);
  }

  async function callback(code: string, state: string) {
    const res = await authApi.callback(code, state);
    setTokens(res.token, res.refreshToken);
    setUserInfo(res.userInfo);
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
    demoLogin,
    callback,
    refresh,
    logout,
    checkAuth,
  };
});
