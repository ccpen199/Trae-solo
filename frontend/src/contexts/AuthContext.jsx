import React, { createContext, useContext, useState, useEffect } from 'react';
import { accountAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('weaver_token');
    const savedUser = localStorage.getItem('weaver_user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('weaver_token');
        localStorage.removeItem('weaver_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginData) => {
    const response = await accountAPI.login(loginData);
    const { success, data, message } = response.data;

    if (!success) {
      throw new Error(message);
    }

    const { token: newToken, user: userData } = data;
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('weaver_token', newToken);
    localStorage.setItem('weaver_user', JSON.stringify(userData));
    
    return { user: userData, token: newToken };
  };

  const register = async (registerData) => {
    const response = await accountAPI.register(registerData);
    const { success, message } = response.data;

    if (!success) {
      throw new Error(message);
    }

    return response.data;
  };

  const logout = async () => {
    try {
      await accountAPI.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    setToken(null);
    setUser(null);
    localStorage.removeItem('weaver_token');
    localStorage.removeItem('weaver_user');
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('weaver_user', JSON.stringify(newUserData));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
