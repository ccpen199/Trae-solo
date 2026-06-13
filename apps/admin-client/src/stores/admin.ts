import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminApi } from '@/api/admin';

interface AdminInfo {
  id: string;
  nameMasked: string;
  role: string;
}

export const useAdminStore = defineStore('admin', () => {
  const token = ref<string>(localStorage.getItem('adminToken') ?? '');
  const adminInfo = ref<AdminInfo | null>(null);
  const currentMenu = ref('dashboard');

  async function login(employeeId: string, password: string) {
    const res = await adminApi.login(employeeId, password);
    token.value = res.token;
    adminInfo.value = res.adminInfo;
    localStorage.setItem('adminToken', res.token);
    return res;
  }

  function logout() {
    token.value = '';
    adminInfo.value = null;
    localStorage.removeItem('adminToken');
  }

  async function checkAuth() {
    if (!token.value) return false;
    try {
      const res = await adminApi.checkAuth();
      adminInfo.value = res.adminInfo;
      return true;
    } catch {
      logout();
      return false;
    }
  }

  return { token, adminInfo, currentMenu, login, logout, checkAuth };
});
