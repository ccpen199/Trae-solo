import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/api/request';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'));
  const profile = ref(JSON.parse(localStorage.getItem('profile') || 'null'));

  const isLoggedIn = computed(() => !!token.value);
  const userRole = computed(() => userInfo.value?.role || '');
  const userName = computed(() => userInfo.value?.name || '');

  const roleNames = {
    admin: '教务处',
    teacher: '教师',
    student: '学生',
    homeroom_teacher: '班主任'
  };

  const userRoleName = computed(() => roleNames[userRole.value] || '');

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    
    token.value = response.data.token;
    userInfo.value = response.data.user;
    profile.value = response.data.profile;

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userInfo', JSON.stringify(response.data.user));
    if (response.data.profile) {
      localStorage.setItem('profile', JSON.stringify(response.data.profile));
    }

    return response.data;
  };

  const logout = () => {
    token.value = '';
    userInfo.value = null;
    profile.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('profile');
  };

  const changePassword = async (oldPassword, newPassword) => {
    await api.post('/auth/change-password', { oldPassword, newPassword });
  };

  return {
    token,
    userInfo,
    profile,
    isLoggedIn,
    userRole,
    userName,
    userRoleName,
    login,
    logout,
    changePassword
  };
});
