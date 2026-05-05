import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, LoginParams, RegisterParams, UpdateProfileParams } from '@/api/auth';
import { EnterpriseType } from '@/types';

export interface UserInfo {
  id: string;
  username: string;
  role: 'admin' | 'enterprise';
  status: string;
  realName?: string;
  phone?: string;
  email?: string;
  enterprise?: {
    id: string;
    enterpriseCode: string;
    enterpriseName: string;
    enterpriseType: EnterpriseType;
  } | null;
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '');
  const userInfo = ref<UserInfo | null>(null);

  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => userInfo.value?.role === 'admin');
  const isEnterprise = computed(() => userInfo.value?.role === 'enterprise');

  async function login(params: LoginParams) {
    const result = await authApi.login(params);
    if (result.success && (result as any).token) {
      token.value = (result as any).token;
      userInfo.value = (result as any).user as UserInfo;
      localStorage.setItem('token', (result as any).token);
      localStorage.setItem('user', JSON.stringify((result as any).user));
    }
    return result;
  }

  async function register(params: RegisterParams) {
    return await authApi.register(params);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async function getCurrentUser() {
    try {
      const result = await authApi.getCurrentUser();
      if (result.success && result.data) {
        userInfo.value = result.data as UserInfo;
        localStorage.setItem('user', JSON.stringify(result.data));
      }
      return result;
    } catch (e) {
      token.value = '';
      userInfo.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw e;
    }
  }

  async function updateProfile(params: UpdateProfileParams) {
    const result = await authApi.updateProfile(params);
    if (result.success) {
      await getCurrentUser();
    }
    return result;
  }

  function initFromStorage() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        userInfo.value = JSON.parse(storedUser);
      } catch (e) {
        console.error('Parse user error:', e);
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    isEnterprise,
    login,
    register,
    logout,
    getCurrentUser,
    updateProfile,
    initFromStorage,
  };
});
