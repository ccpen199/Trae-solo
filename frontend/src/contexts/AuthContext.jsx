import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authApi.login({ username, password });
      const data = response.data;

      if (data.success) {
        const userData = data.data.user;
        const tokenData = data.data.token;

        setUser(userData);
        setToken(tokenData);
        localStorage.setItem('token', tokenData);
        localStorage.setItem('user', JSON.stringify(userData));

        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || '登录失败';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      const data = response.data;

      if (data.success) {
        const userInfo = data.data.user;
        const tokenData = data.data.token;

        setUser(userInfo);
        setToken(tokenData);
        localStorage.setItem('token', tokenData);
        localStorage.setItem('user', JSON.stringify(userInfo));

        return { success: true, data: data.data };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      const message = error.response?.data?.message || '注册失败';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
