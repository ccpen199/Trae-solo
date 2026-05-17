import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userPhone = localStorage.getItem('userPhone');
    const merchantName = localStorage.getItem('merchantName');
    
    if (userId && userPhone) {
      setUser({ id: userId, phone: userPhone, merchantName });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('userPhone', userData.phone);
    localStorage.setItem('merchantName', userData.merchantName);
    setUser({
      id: userData.userId,
      phone: userData.phone,
      merchantName: userData.merchantName
    });
    message.success('登录成功');
  };

  const logout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('merchantName');
    setUser(null);
    message.success('已退出登录');
  };

  return (
    <AppContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
