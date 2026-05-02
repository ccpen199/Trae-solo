import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null);
  const token = ref(null);

  const isLoggedIn = computed(() => !!userInfo.value);
  const isRegulator = computed(() => userInfo.value?.role === 'regulator');
  const isEnterprise = computed(() => userInfo.value?.role === 'enterprise');
  const isMaintenance = computed(() => userInfo.value?.role === 'maintenance');
  const isPublic = computed(() => userInfo.value?.role === 'public');

  const roleName = computed(() => {
    const roles = {
      regulator: '监管员',
      enterprise: '企业负责人',
      maintenance: '第三方运维商',
      public: '公众参与者',
    };
    return roles[userInfo.value?.role] || '未知';
  });

  function login(user) {
    userInfo.value = user;
    localStorage.setItem('userInfo', JSON.stringify(user));
  }

  function logout() {
    userInfo.value = null;
    token.value = null;
    localStorage.removeItem('userInfo');
  }

  function getStoredUser() {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      userInfo.value = JSON.parse(stored);
    }
    return userInfo.value;
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    isRegulator,
    isEnterprise,
    isMaintenance,
    isPublic,
    roleName,
    login,
    logout,
    getStoredUser,
  };
});
