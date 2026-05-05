import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authApi.checkAuth();
      if (response.authenticated) {
        setUser(response.user);
        setIsAdmin(response.isAdmin);
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    setUser(response.data.user);
    setIsAdmin(response.data.user.role === 'admin');
    return response;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    return response;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('退出登录失败:', error);
    }
    setUser(null);
    setIsAdmin(false);
  };

  const deleteAccount = async () => {
    const response = await authApi.deleteAccount();
    setUser(null);
    setIsAdmin(false);
    return response;
  };

  const updateUserInfo = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    deleteAccount,
    updateUserInfo,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
