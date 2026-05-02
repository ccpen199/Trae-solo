import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import { authAPI, messagesAPI } from '../utils/api';

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchUnreadCount(parsedUser.id);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const fetchUnreadCount = async (userId) => {
    try {
      const response = await messagesAPI.getUnreadCount(userId);
      if (response.data.success) {
        setUnreadCount(response.data.data.unread_count);
      }
    } catch (e) {
      console.error('获取未读消息数量失败:', e);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        fetchUnreadCount(userData.id);
        message.success('登录成功');
        return { success: true };
      } else {
        message.error(response.data.message || '登录失败');
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '登录失败，请检查网络连接';
      message.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setUnreadCount(0);
    localStorage.removeItem('user');
    message.info('已退出登录');
  };

  const refreshUnreadCount = () => {
    if (user) {
      fetchUnreadCount(user.id);
    }
  };

  const value = {
    user,
    unreadCount,
    loading,
    login,
    logout,
    refreshUnreadCount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
