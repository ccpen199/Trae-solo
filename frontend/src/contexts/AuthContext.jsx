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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await authApi.login(username, password);
    const { token, user } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout API error:', e);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      const userData = response.data.data;
      
      localStorage.setItem('user', JSON.stringify(userData.user));
      setUser(userData.user);
      
      return userData.user;
    } catch (e) {
      console.error('Refresh user error:', e);
      throw e;
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions?.includes(permission);
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.roles?.some(r => r.name === role);
  };

  const isAuthenticated = !!user;
  const isAdmin = () => hasRole('admin');
  const isOperator = () => hasRole('operator') || isAdmin();
  const isFinance = () => hasRole('finance') || isAdmin();
  const isTechLead = () => hasRole('tech_lead') || isAdmin();
  const isSubscriber = () => hasRole('subscriber');

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
    isAdmin,
    isOperator,
    isFinance,
    isTechLead,
    isSubscriber,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
