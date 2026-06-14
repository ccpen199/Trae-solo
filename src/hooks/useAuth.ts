import { useCallback } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import { usePermissionStore } from '@/stores/usePermissionStore';
import { login as loginApi, logout as logoutApi, getUserInfo, getPermissions } from '@/services/api/auth';
import type { LoginParams } from '@/services/api/auth';

export interface UseAuthReturn {
  login: (params: LoginParams) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  getToken: () => string;
  fetchUserInfo: () => Promise<void>;
  fetchPermissions: () => Promise<void>;
}

const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const { setToken, setUserInfo, clearUser, token } = useUserStore();
  const { setRoutes, setButtons, clearPermissions } = usePermissionStore();

  const isAuthenticated = useCallback(() => {
    return !!token && token.length > 0;
  }, [token]);

  const getToken = useCallback(() => {
    return token;
  }, [token]);

  const login = useCallback(async (params: LoginParams) => {
    try {
      const res = await loginApi(params);
      if (res.code === 200 && res.data) {
        setToken(res.data.token);
        if (res.data.userInfo) {
          setUserInfo(res.data.userInfo);
        }
        message.success('登录成功');
        await fetchPermissions();
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [setToken, setUserInfo, navigate]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      clearUser();
      clearPermissions();
      message.success('已退出登录');
      navigate('/login', { replace: true });
    }
  }, [clearUser, clearPermissions, navigate]);

  const fetchUserInfo = useCallback(async () => {
    try {
      const res = await getUserInfo();
      if (res.code === 200 && res.data) {
        setUserInfo(res.data);
      }
    } catch (error) {
      console.error('Fetch user info failed:', error);
      throw error;
    }
  }, [setUserInfo]);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await getPermissions();
      if (res.code === 200 && res.data) {
        setRoutes(res.data.routes || []);
        setButtons(res.data.buttons || []);
      }
    } catch (error) {
      console.error('Fetch permissions failed:', error);
      throw error;
    }
  }, [setRoutes, setButtons]);

  return {
    login,
    logout,
    isAuthenticated,
    getToken,
    fetchUserInfo,
    fetchPermissions,
  };
};

export default useAuth;
