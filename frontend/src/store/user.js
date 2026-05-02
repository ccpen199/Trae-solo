import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api';
import router from '@/router';

export const useUserStore = defineStore('user', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || '');

  const isLoggedIn = computed(() => !!token.value && !!user.value);
  
  const permissions = computed(() => user.value?.permissions || []);
  const roles = computed(() => user.value?.roles || []);

  const hasPermission = (permissionCode) => {
    if (roles.value.includes('admin')) return true;
    return permissions.value.includes(permissionCode);
  };

  const hasRole = (roleCode) => {
    if (roles.value.includes('admin')) return true;
    return roles.value.includes(roleCode);
  };

  const login = async (username, password) => {
    const result = await authApi.login({ username, password });
    token.value = result.data.token;
    user.value = result.data.user;
    localStorage.setItem('token', result.data.token);
    return result;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // 忽略登出接口错误
    }
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
    router.push('/login');
  };

  const fetchUserInfo = async () => {
    const result = await authApi.getCurrentUser();
    user.value = result.data;
    return result;
  };

  return {
    user,
    token,
    isLoggedIn,
    permissions,
    roles,
    hasPermission,
    hasRole,
    login,
    logout,
    fetchUserInfo
  };
});
