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

  function demoLogin(role: string = 'supervisor') {
    const roles: Record<string, { id: string; nameMasked: string; role: string }> = {
      supervisor: {
        id: 'GX-ADMIN-001', nameMasked: '李*明', role: '超级管理员' },
      auditor: {
        id: 'GX-AUDIT-023', nameMasked: '王*华', role: '审计员' },
      operator: {
        id: 'GX-OPS-108', nameMasked: '赵*琴', role: '运营专员' },
    };
    const info = roles[role] || roles.supervisor;
    token.value = 'demo-admin-token-' + Date.now();
    adminInfo.value = info;
    localStorage.setItem('adminToken', token.value);
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
