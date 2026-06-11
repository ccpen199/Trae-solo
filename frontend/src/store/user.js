import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi, logoutApi, getUserInfoApi } from '@/api/auth';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'));
  const tokenValidated = ref(false);

  const isLoggedIn = computed(() => !!token.value && tokenValidated.value);
  const authLevel = computed(() => userInfo.value?.auth_level || 1);
  const province = computed(() => userInfo.value?.province || '北京市');

  const validateToken = async () => {
    if (!token.value) {
      tokenValidated.value = false;
      return false;
    }
    try {
      const res = await getUserInfoApi();
      if (res.code === 200 && res.data) {
        userInfo.value = res.data;
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        tokenValidated.value = true;
        return true;
      }
      token.value = '';
      userInfo.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      tokenValidated.value = false;
      return false;
    } catch (e) {
      token.value = '';
      userInfo.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      tokenValidated.value = false;
      return false;
    }
  };

  const login = async (phone, password) => {
    try {
      const res = await loginApi(phone, password);
      if (res.code === 200 && res.data) {
        token.value = res.data.token;
        userInfo.value = res.data.user;
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));
        tokenValidated.value = true;
        return { success: true };
      }
      return { success: false, message: res?.message || '登录失败', code: res?.code };
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || '登录失败，请重试';
      return { success: false, message, code: error?.response?.data?.code };
    }
  };

  const govAuth = async (govToken, realName, idCard) => {
    try {
      const res = await fetch('/api/auth/gov-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gov_token: govToken, real_name: realName, id_card: idCard }),
      }).then(r => r.json());
      if (res.code === 200 && res.data) {
        token.value = res.data.token;
        userInfo.value = res.data.user;
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res?.message || '认证失败' };
    } catch (error) {
      const message = error?.message || '认证失败，请重试';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error('Logout API error:', e);
    } finally {
      token.value = '';
      userInfo.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
    }
  };

  const fetchUserInfo = async () => {
    const res = await getUserInfoApi();
    if (res.code === 200 && res.data) {
      userInfo.value = res.data;
      localStorage.setItem('userInfo', JSON.stringify(res.data));
      return res.data;
    }
    return null;
  };

  const updateUserInfo = (info) => {
    userInfo.value = { ...userInfo.value, ...info };
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value));
  };

  return {
    token,
    userInfo,
    tokenValidated,
    isLoggedIn,
    authLevel,
    province,
    login,
    govAuth,
    logout,
    fetchUserInfo,
    validateToken,
    updateUserInfo,
  };
});
