import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserRole } from '@/types';
import { authApi } from '@/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<User | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const userRole = computed(() => user.value?.role || null);

  const initUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        user.value = JSON.parse(userStr);
      } catch {
        logout();
      }
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const result = await authApi.login(username, password);
      
      if (result.success && result.data) {
        token.value = result.data.token;
        user.value = result.data.user;
        
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        
        return { success: true };
      }
      
      return { success: false, message: result.message || '登录失败' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return { success: false, message: err.response?.data?.message || '登录失败' };
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user.value) return false;
    if (Array.isArray(role)) {
      return role.includes(user.value.role);
    }
    return user.value.role === role;
  };

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    initUser,
    login,
    logout,
    hasRole
  };
});
